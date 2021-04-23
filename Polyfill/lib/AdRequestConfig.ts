// Copyright (C) Microsoft Corporation. All rights reserved.

import { AdProperties } from './AdProperties';
import { AdTargeting } from './AdTargeting';
import { AnonymizedSignals } from './AnonymizedSignals';

export class AdRequestConfig {
  /**
  * The origin that the anonymizing service request the ad bundle from. A
  * .well-known path, e.g. /.well-known/ad-request, will be queried by the
  * service.
  */
  proxiedAnonymizingOrigin: string;
  /**
  * A set of properties whose names and values map to a well-known list of
  * supported values and help inform the ad network of what type of ad to serve.
  */
  adProperties: AdProperties;
  /**
  *  The number identifier that represents a specific publisher's identity
  *  registered with the ad network.
  */
  publisherCode: string;
  /**
  * The string identifier that represents an ad unit/vertical that the
  * publisher has registered with the ad network.
  */
  publisherAdUnit: string;
  /**
  * Contextual targeting information for the ad.
  */
  targeting: AdTargeting;
  /**
  * Specifies what information should be added or allowed to pass through with
  * the ad request by the anonymizing request service.
  */
  anonymizedProxiedSignals: AnonymizedSignals[];
  /**
  * If anonymized ad request flows are not supported, either because of a
  * global decision, a local user decision, or due to an infrastructure outage,
  * this will be used to load the ad content as a fallback.
  */
  fallbackSource: URL;

  constructor(other?: AdRequestConfig) {
    if (other) {
      // Allow construction from JS objects that have the correct properties.
      this.proxiedAnonymizingOrigin = other.proxiedAnonymizingOrigin
      this.adProperties = new AdProperties(other.adProperties);
      this.publisherCode = other.publisherCode;
      this.publisherAdUnit = other.publisherAdUnit;
      this.targeting = new AdTargeting(other.targeting);
      this.anonymizedProxiedSignals = Array.isArray(other.anonymizedProxiedSignals) ? other.anonymizedProxiedSignals.slice() : [];
      if (typeof other.fallbackSource === 'string') {
        this.fallbackSource = new URL(other.fallbackSource);
      } else {
        this.fallbackSource = (!!other.fallbackSource && other.fallbackSource instanceof URL) ? other.fallbackSource : new URL("about:blank");
      }
    } else {
      this.proxiedAnonymizingOrigin = "";
      this.adProperties = new AdProperties();
      this.publisherCode = "";
      this.publisherAdUnit = "";
      this.targeting = new AdTargeting();
      this.anonymizedProxiedSignals = [];
      this.fallbackSource = new URL("about:blank");
    }
  }

  toRequestBody(): string {
    let json = JSON.stringify(this);
    // Modify our properties to match the service expectations.
    json = json.replace('proxiedAnonymizingOrigin', 'proxied-anonymizing-origin');
    json = json.replace('adProperties', 'ad-properties');
    json = json.replace('publisherCode', 'publisher-code');
    json = json.replace('publisherAdUnit', 'publisher-ad-unit');
    json = json.replace('anonymizedProxiedSignals', 'anonymized-proxied-signals');
    json = json.replace('fallbackSource', 'fallback-source');

    return json;
  }

  // Stores any joined AdInterests, not setable by callers and will be
  // overwritten.
  joinedGroups = {};
}

AdRequestConfig.prototype.proxiedAnonymizingOrigin = "";
AdRequestConfig.prototype.adProperties = AdProperties.prototype;
AdRequestConfig.prototype.publisherCode = "";
AdRequestConfig.prototype.publisherAdUnit = "";
AdRequestConfig.prototype.targeting = AdTargeting.prototype;
AdRequestConfig.prototype.anonymizedProxiedSignals = [];
AdRequestConfig.prototype.fallbackSource = URL.prototype;
