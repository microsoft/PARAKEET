// Copyright (C) Microsoft Corporation. All rights reserved.

const endpoint = "https://edge.microsoft.com/.well-known/ad-bundles";

// General helpers for API configuration and use.
import {
  Parakeet,
  ShouldReturnBlob,
  ShouldServeAds,
  HasStorageOrigin,
  RemotelyRequestAd,
  RemotelyStoreInterestGroup
} from './lib/ParakeetHelpers';

// Imports for request ads.
import { AdProperties } from './lib/AdProperties';
import { AdTargeting } from './lib/AdTargeting';
import { AdRequestConfig } from './lib/AdRequestConfig';
import { Geo } from './lib/Geo';

// Imports for joining interest groups.
import { AdInterests } from './lib/AdInterests';
import {
  GetInterestGroups,
  StoreInterestGroup
} from './lib/InterestGroups';

export function SetStorageOrigin(origin: URL) {
}

declare global {
  var AdProperties: {
    prototype: AdProperties;
    new(other?: AdProperties): AdProperties;
  };

  var AdTargeting: {
    prototype: AdTargeting;
    new(other?: AdTargeting): AdTargeting;
  };

  var Geo: {
    prototype: Geo;
    new(other?: Geo): Geo;
  };

  var AdRequestConfig: {
    prototype: AdRequestConfig;
    new(other?: AdRequestConfig): AdRequestConfig;
  };

  var AdInterests: {
    prototype: AdInterests;
    new(other?: AdInterests): AdInterests;
  };

  interface Navigator {
    createAdRequest: (config: AdRequestConfig) => Promise<URL | Blob>;
    joinParakeetInterestGroup: (interests: AdInterests, duration: number) => Promise<any>;
  }

  var Parakeet: Parakeet;
}

// Install our global types for requests/interest groups.
// Requesting ads.
if (!globalThis.AdProperties) {
  globalThis.AdProperties = AdProperties;
}

if (!globalThis.AdTargeting) {
  globalThis.AdTargeting = AdTargeting;
}

if (!globalThis.Geo) {
  globalThis.Geo = Geo;
}

if (!globalThis.AdRequestConfig) {
  globalThis.AdRequestConfig = AdRequestConfig;
}

// Joining interest groups.
if (!globalThis.AdInterests) {
  globalThis.AdInterests = AdInterests;
}

// Parakeet configuration helpers.
if (!globalThis.Parakeet) {
  globalThis.Parakeet = new Parakeet();
}

// Install our primary usage methods off of the Navigator interface if they
// aren't yet defined.
if (!Navigator.prototype.createAdRequest) {
  Navigator.prototype.createAdRequest = function (config) {
    const creationPromise = new Promise<URL | Blob>(function (resolve, reject) {
      try {
        // In case we get a JSON string, we'll try to parse it into an object
        // that can be serialized as an AdRequestConfig.
        if (typeof (config) === 'string') {
          config = JSON.parse(config);
        }
        // Strongly create a new AdRequestConfig from the passed in |config| to
        // strip extra types / properties.
        let parsedConfig = new AdRequestConfig(config);

        // If we have a storage origin set we'll try to communicate with it and
        // have it store our interests.
        if (HasStorageOrigin()) {
          RemotelyRequestAd(parsedConfig).then(adUrl => {
            resolve(adUrl);
          }).catch(e => {
            reject(e);
          });
        } else {
          // Actually create the ad request, this will execute in our remote
          // storage origin, if applicable, to ensure stored interests are not
          // leaked out to callers.

          // Try and get any stored interest groups and merge them with any
          // contextual interest groups to send for anonymization.
          try {
            parsedConfig.joinedGroups = {};
            parsedConfig.joinedGroups = GetInterestGroups();
          } catch (e) {
            reject(e);
          }

          fetch(endpoint, {
            method: "POST",
            credentials: "omit",
            headers: { "Content-Type": "application/json" },
            body: parsedConfig.toRequestBody()
          }).then(response => {
            if (ShouldServeAds()) {
              response.blob().then(responseBlob => {
                return resolve(ShouldReturnBlob() ? responseBlob : new URL(URL.createObjectURL(responseBlob)));
              }).catch(e => {
                reject(e);
              });
            } else {
              // If we're not directly serving ads, then we'll return raw JSON data
              // to the caller to use for diagnostics / telem on effectiveness.
              response.json().then(responseData => {
                return resolve(responseData);
              }).catch(e => {
                reject(e);
              });
            }
          }).catch(e => {
            reject(e);
          });
        }
      } catch (e) {
        reject(e);
      }

    });
    return creationPromise;
  }
}


if (!Navigator.prototype.joinParakeetInterestGroup) {
  Navigator.prototype.joinParakeetInterestGroup = function (interests, duration) {
    const creationPromise = new Promise(function (resolve, reject) {
      try {
        if (typeof (duration) !== 'number' || duration <= 0) {
          throw new TypeError("Duration must be a number > 0.");
        }

        // In case we get a JSON string, we'll try to parse it into an object
        // that can be serialized as an AdInterests.
        if (typeof (interests) === 'string') {
          interests = JSON.parse(interests);
        }

        // Strongly create a new AdInterests from the passed in |interests| to
        // strip extra types / properties.
        const parsedInterests = new AdInterests(interests);

        // If we have a storage origin set we'll try to communicate with it and
        // have it store our interests.
        if (HasStorageOrigin()) {
          RemotelyStoreInterestGroup(interests, duration).then(() => {
            resolve(undefined);
          }).catch(e => {
            reject(e);
          });
        } else {
          // Otherwise we'll directly store them in our current origin.
          StoreInterestGroup(parsedInterests, duration, window.origin);
          resolve(undefined);
        }
      } catch (e) {
        reject(e);
      }
    });
    return creationPromise;
  }
}
