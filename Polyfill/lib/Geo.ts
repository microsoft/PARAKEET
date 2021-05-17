// Copyright (C) Microsoft Corporation. All rights reserved.

// Representations of relevant Geo fields. This should reflect the OpenRTB
// schema: https://developers.google.com/authorized-buyers/rtb/openrtb-guide#geo
export class Geo {
  /**
   * Latitude from -90.0 to +90.0, where negative is south.
   */
  lat?: number;
  /**
   * Longitude from -180.0 to +180.0, where negative is west.
   */
  lon?: number;

  constructor(other?: Geo) {
    if (other) {
      this.lat = other.lat;
      this.lon = other.lon;
    } else {
      this.lat = undefined;
      this.lon = undefined;
    }
  }
}

Geo.prototype.lat = undefined;
Geo.prototype.lon = undefined;
