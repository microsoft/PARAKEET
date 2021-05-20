// Copyright (C) Microsoft Corporation. All rights reserved.

import { Geo } from './Geo';

export class AdTargeting {
  /**
  * A list of interests specific to a given ad request. These may include
  * contextual signals made available at the time of the request.
  */
  interests?: string[];
  /**
  * Geolocation information the requesting site may be aware of.
  */
  geolocation?: Geo;

  constructor(other?: AdTargeting) {
    if (other) {
      this.interests = Array.isArray(other.interests) ? other.interests.slice() : [];
      this.geolocation = new Geo(other.geolocation);
    } else {
      this.interests = [];
      this.geolocation = new Geo();
    }
  }
}

AdTargeting.prototype.interests = [];
AdTargeting.prototype.geolocation = Geo.prototype;
