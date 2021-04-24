// Copyright (C) Microsoft Corporation. All rights reserved.

export class AdInterests {
  /**
  * The advertiser domain that is adding the user to a specific interest group.
  * This will be used to restrict the usage of that interest group as well as
  * to improve user transparency.
  */
  origin: URL;
  /**
  * The overall business/enterprise that owns the domain. This is largely for
  * transparency so that a user may know which businesses are tracking them.
  */
  business?: string;
  /**
  * A list of ad interests based on current activities or group activities on
  * the domain.
  */
  interests: string[];
  /**
  * A list of vector representation models supported by the browser and are
  * permitted to encode page content. Any unsupported values are ignored.
  */
  representations?: string[];
  /**
  * A list of ad networks allowed to use ad interests and representations.
  */
  readers: string[];

  constructor(other?: AdInterests) {
    if (other) {
      if (typeof other.origin === 'string') {
        this.origin = new URL(other.origin);
      } else {
        this.origin = (!!other.origin && other.origin instanceof URL) ? other.origin : new URL("about:blank");
      }
      this.business = other.business;
      this.interests = Array.isArray(other.interests) ? other.interests.slice() : [];
      this.representations = Array.isArray(other.representations) ? other.representations.slice() : [];
      this.readers = other.readers;
    } else {
      this.origin = new URL("about:blank");
      this.business = "";
      this.interests = [];
      this.representations = [];
      this.readers = [];
    }
  }
}

AdInterests.prototype.origin = URL.prototype;
AdInterests.prototype.business = "";
AdInterests.prototype.interests = [];
AdInterests.prototype.representations = [];
AdInterests.prototype.readers = [];
