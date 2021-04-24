// Copyright (C) Microsoft Corporation. All rights reserved.

let serveAds = true;
let storageOrigin: URL | null = null;

let remoteFrame: HTMLIFrameElement | null = null;
const remoteChannel = new MessageChannel();

let sendingPort: MessagePort | null = null;

// Queue of promise resolve/reject methods we have sent out. As we get
// responses back we'll handle these.
let outstandingPromises = new Array();

// When we're hosted as a remote storage solution we need to return our
// whole blob response instead of just the URL.
let returnBlob = false;

import { AdRequestConfig } from './AdRequestConfig';
import { AdInterests } from './AdInterests';
import { StoreInterestGroup } from './InterestGroups';

// Methods not exposed on outside of polyfill/built libraries.
export function ShouldServeAds(): boolean {
  return serveAds;
}

export function HasStorageOrigin(): boolean {
  return (!!storageOrigin && storageOrigin instanceof URL);
}

export function ShouldReturnBlob(): boolean {
  return returnBlob;
}

// Public convenience helpers.
export class Parakeet {
  /**
   * Set if Parakeet should serve ads or return diagnostic data only.
   * @param newState
   */
  SetServeAds(newState: boolean): void {
    serveAds = !!newState;
  }

  /**
   * Set origin to store data under. All joined interest groups will be
   * privately stored under this origin. By default, null, indicates silo'd
   * storage the current top-level-origin.
   * @param origin
   */
  SetStorageOrigin(origin: URL): void {
    if (remoteFrame instanceof HTMLIFrameElement) {
      throw new TypeError("Unable to change StorageOrigin if the remote storage has been used already.");
    }
    storageOrigin = (!!origin && origin instanceof URL) ? origin : null;
  }

  /**
   * Helper to be called when operating as the remote storageOrigin. 
   * Will setup the appropriate listeners and wait to be initialized by
   * the non-remote client origin.
   */
  ListenAsRemoteStorage(): void {
    if (HasStorageOrigin()) {
      throw new TypeError("Unable to act as remote storage if StorageOrigin is set.");
    }

    returnBlob = true;

    window.addEventListener('message', event => {
      if (this.receivingPort instanceof MessagePort) {
        // We've already initialized.
        return;
      }

      if ((event.data == "Initialize") && (event.ports[0] instanceof MessagePort)) {
        this.receivingPort = event.ports[0];
        this.clientOrigin = event.origin;
        this.receivingPort.onmessage = this.ServerOnMessage.bind(this);
        this.receivingPort.start();
      }
    }, false);
  }

  // Handler for any messages from our client, such as performing remote storage or ad requests.
  private ServerOnMessage(message: MessageEvent<any>): void {
    if (this.receivingPort instanceof MessagePort) {
      try {
        if (message.data.type == "StoreInterestGroup") {
          const parsedInterests = new AdInterests(JSON.parse(message.data.interests));
          const duration = message.data.duration;
          StoreInterestGroup(parsedInterests, duration, this.clientOrigin);
          this.receivingPort.postMessage({ result: "OK", data: undefined });
        } else if (message.data.type == "RequestAd") {
          const parsedConfig = new AdRequestConfig(JSON.parse(message.data.config));
          const port = this.receivingPort;
          navigator.createAdRequest(parsedConfig).then(adUrl => {
            port.postMessage({ result: "OK", data: adUrl });
          }).catch(e => {
            port.postMessage({ result: "Error", data: e });
          });
        }
      } catch (e) {
        this.receivingPort.postMessage({ result: "Error", data: e });
      }
    }
  }

  private receivingPort: MessagePort | null = null;
  private clientOrigin = "";
}

// Handler for any messages from our remote frame such as acks/errors.
function ClientOnMessage(message: MessageEvent<any>) {
  // Get our oldest promise and ensure we actually had one outstanding.
  const outstandingPromise = outstandingPromises.shift();
  if (!outstandingPromise || !outstandingPromise.resolver || !outstandingPromise.rejecter) {
    return;
  }

  // If we received a blob we can store it as an URL now.
  if (message.data.data instanceof Blob) {
    message.data.data = new URL(URL.createObjectURL(message.data.data));
  }

  // Resolve or reject our pending promise now that we have our resonse.
  (message.data.result == "OK") ? outstandingPromise.resolver(message.data.data) : outstandingPromise.rejecter(message.data.data);
}

// Helper to ensure we have a frame setup for the storageOrigin and we can
// communicate with it.
function EnsureRemoteStorageFrame(): Promise<undefined> {
  const creationPromise = new Promise<undefined>(function (resolve, reject) {
    if (!storageOrigin) {
      return reject(new TypeError('No PARAKEET StorageOrigin configured.'));
    }

    if (remoteFrame instanceof HTMLIFrameElement) {
      // No-op since we have a frame setup.
      return resolve(undefined);
    }

    remoteFrame = document.createElement('iframe');
    remoteFrame.sandbox.add('allow-same-origin');
    remoteFrame.sandbox.add('allow-scripts');
    remoteFrame.height = "0px";
    remoteFrame.width = "0px";
    remoteFrame.style.display = "none";

    remoteFrame.addEventListener('load', () => {
      if (!storageOrigin) {
        return reject(new TypeError('No PARAKEET StorageOrigin configured.'));
      }

      remoteFrame?.contentWindow?.postMessage('Initialize', storageOrigin.toString(), [remoteChannel.port2]);
      sendingPort = remoteChannel.port1;
      sendingPort.onmessage = ClientOnMessage;
      sendingPort.start();

      resolve(undefined);
    }, false);

    remoteFrame.addEventListener('error', () => {
      reject(new TypeError('Unable to load remote StorageOrigin "' + storageOrigin + '".'));
    }, false);

    remoteFrame.src = storageOrigin.toString();
    document.body.appendChild(remoteFrame);
  });
  return creationPromise;
}

// Helpers to proxy our exposed methods to our remote storage frame.
export function RemotelyRequestAd(config: AdRequestConfig): Promise<URL> {
  const creationPromise = new Promise<URL>(function (resolve, reject) {
    EnsureRemoteStorageFrame().then(() => {
      if (sendingPort instanceof MessagePort) {
        // Store our promise methods prior to sending our message in case we
        // get a quick response.
        outstandingPromises.push({ resolver: resolve, rejecter: reject });
        sendingPort.postMessage({
          type: "RequestAd",
          config: JSON.stringify(config)
        });
      } else {
        reject(new TypeError('Unable to communicate with remote StorageOrigin.'));
      }
    }).catch(e => {
      reject(e);
    });
  });
  return creationPromise;
}

export function RemotelyStoreInterestGroup(parsedInterests: AdInterests, duration: number): Promise<any> {
  const creationPromise = new Promise(function (resolve, reject) {
    EnsureRemoteStorageFrame().then(() => {
      if (sendingPort instanceof MessagePort) {
        // Store our promise methods prior to sending our message in case we
        // get a quick response.
        outstandingPromises.push({ resolver: resolve, rejecter: reject });
        sendingPort.postMessage({
          type: "StoreInterestGroup",
          interests: JSON.stringify(parsedInterests),
          duration: duration
        });
      } else {
        reject(new TypeError('Unable to communicate with remote StorageOrigin.'));
      }
    }).catch(e => {
      reject(e);
    });
  });
  return creationPromise;
}