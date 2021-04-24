// Copyright (C) Microsoft Corporation. All rights reserved.

export class AdTargeting {
  /**
  * A list of interests specific to a given ad request. These may include
  * contextual signals made available at the time of the request.
  */
  interests?: string[];
  /**
  * Geolocation information the requesting site may be aware of.
  */
  geolocation?: number[];

  constructor(other?: AdTargeting) {
    if (other) {
      this.interests = Array.isArray(other.interests) ? other.interests.slice() : [];
      this.geolocation = Array.isArray(other.geolocation) ? other.geolocation.slice() : [];
    } else {
      this.interests = [];
      this.geolocation = [];
    }
  }
}

AdTargeting.prototype.interests = [];
AdTargeting.prototype.geolocation = [];
