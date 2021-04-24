// Copyright (C) Microsoft Corporation. All rights reserved.

export class AdProperties {
  /**
  * Requested orientation of the ad. e.g. landscape.
  */
  orientation?: string;
  /**
  * Requested size. e.g. medium, large, ...
  */
  size?: string;
  /**
  * Requested ad slot. e.g. div-xyz-abc.
  */
  slot?: string;
  /**
  * Requested language. e.g. en-us.
  */
  lang?: string;
  /**
  * Requested ad type. e.g. image/native.
  */
  adtype?: string;

  constructor(other?: AdProperties | undefined) {
    if (other) {
      this.orientation = other.orientation;
      this.size = other.size;
      this.slot = other.slot;
      this.lang = other.lang;
      this.adtype = other.adtype;
    } else {
      this.orientation = "";
      this.size = "";
      this.slot = "";
      this.lang = "";
      this.adtype = "";
    }
  }
}

AdProperties.prototype.orientation = "";
AdProperties.prototype.size = "";
AdProperties.prototype.slot = "";
AdProperties.prototype.lang = "";
AdProperties.prototype.adtype = "";
