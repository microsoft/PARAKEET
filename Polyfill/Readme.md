## PARAKEET Polyfill

In order to enable evaluation of PARAKEET by interested parties as soon as
possible, we're building a Javascript based implementation built on top of
existing web technologies. We aim to simulate the final state as closely and
as reasonably as possible prior to other privacy restrictions being implemented
in the web platform that will eventually limit cross-site storage; at that
later stage, this polyfill will no longer be a viable evaluation tool.

This polyfill will give developers early and frequent access to test the latest API shape and ergonomics for PARAKEET with test data traffic while also allowing us to iterate quickly and address any changes needed prior to making this a part of the web platform natively. 

By downloading and using this library, developers hereby agree that they shall NOT deploy this code on production servers with real user data.

Any data collected will be for research purposes to understand the usage of proposed API calls around privacy-preserving call flows from publishers using PARAKEET.

#### Status
_**Draft**_; we're still working on validating an initial version for everyone to
 try out.

#### Reference material
- [Parakeet](https://github.com/WICG/privacy-preserving-ads/blob/main/Parakeet.md)
- [Fenced Frames](https://github.com/shivanigithub/fenced-frame)

#### Overview
PARAKEET relies on a trusted service to take requests and ensure anonymization
during the ad serving process. The final design to be natively built into the
browser will make use of a Fenced Frame to render an "opaque source". That
opaque source will be handled by the browser client working with the PARAKEET
service to complete an end-to-end auction flow which will ultimately result in
an ad bundle being returned for rendering.

Fenced Frames are not currently part of the web platform, so the initial
prototype will leverage standard iframes to serve winning ad requests. This
interim state also provides more ability for developers to collect their own
telemetry to get a more accurate evaluation of the performance and tradeoffs
of the system.

As part of the request process, information that is contextual (from the page
the user is on) and related to the current ad request will be sent together with
previously joined interest groups to the PARAKEET service. The following APIs
and types have been exposed as part of this polyfill to enable this request
flow:

- [PARAKEET Polyfill](#parakeet-polyfill)
    - [Status](#status)
    - [Reference material](#reference-material)
    - [Overview](#overview)
    - [Usage](#usage)
        - [Include directly on a webpage](#include-directly-on-a-webpage)
    - [Current API set](#current-api-set)
      - [Types/classes](#typesclasses)
        - [AdInterests](#adinterests)
        - [AdProperties](#adproperties)
        - [AdRequestConfig](#adrequestconfig)
        - [AdTargeting](#adtargeting)
        - [AnonymizedSignals](#anonymizedsignals)
      - [Methods](#methods)
        - [Navigator.createAdRequest](#navigatorcreateadrequest)
        - [Navigator.joinParakeetInterestGroup](#navigatorjoinparakeetinterestgroup)
      - [Configuration Helpers](#configuration-helpers)
        - [Parakeet.SetServeAds](#parakeet.setserveads)
        - [Parakeet.SetStorageOrigin](#parakeet.setstorageorigin)
        - [Parakeet.ListenAsRemoteStorage](#parakeet.listenasremotestorage)
    - [Examples](#examples)
      - [Host a PARAKEET storage 'silo'](#host-a-parakeet-storage-silo)
      - [Join an interest group or two](#join-an-interest-group-or-two)
      - [Create an AdRequest and serve an ad](#create-an-adrequest-and-serve-an-ad)

<br/>

#### Usage
This library can be compiled and used directly as part of another NPM or
TypeScript project. We also plan to release both minified and non-minified vanilla
JavaScript bundles that can be directly included as part of other stacks. If
another format would be useful, let us know by opening an issue, and we'll see what we can do!

###### Include directly on a webpage
```html
<script src='https://somecontentsite.example/libs/parakeet.min.js' type='text/script'/>
<script>Parakeet.SetStorageOrigin(new URL("https://edge.microsoft.com/parakeet/frame.html"));</script>
<!-- You're now ready to use PARAKEET! -->
````

###### Inject from other script/ad tech
```javascript
let scriptTag = document.createElement('script');
scriptTag.src = 'https://somecontentsite.example/libs/parakeet.min.js';
document.body.appendChild(scriptTag);
// You're now ready to use Parakeet!
```
<br/>

#### Current API set
The current version of the Parakeet Polyfill defines the following methods and
 types.

##### Types/classes

###### AdInterests
Details of the ad interests to join for later use with an ad request.

_Note: currently `representations` are not currently used._
```typescript
export class AdInterests {
  // The advertiser domain that is adding the user to a specific interest group.
  // This will be used to restrict the usage of that interest group as well as
  // to improve user transparency.
  origin: URL;
  // The overall business/enterprise that owns the domain. This is largely for
  // transparency so that a user may know which businesses are tracking them.
  business?: string;
  // A list of ad interests based on current activities or group activities on
  // the domain.
  interests: string[];
  // A list of vector representation models supported by the browser and are
  // permitted to encode page content. Any unsupported values are ignored.
  representations?: string[];
  // A list of ad networks allowed to use ad interests and representations.
  readers: string[];
}
```

###### AdProperties
Intended to capture the properties of the desired ad. All properties are left as
string types to allow integration with various ad tech platforms and
definitions.
```typescript
export class AdProperties {
  // Requested orientation of the ad. e.g. landscape.
  orientation?: string;
  // Requested size. e.g. medium, large, ...
  size?: string;
  // Requested ad slot. e.g. div-xyz-abc.
  slot?: string;
  // Requested language. e.g. en-us.
  lang?: string;
  // Requested ad type. e.g. image/native.
  adtype?: string;
}
```

###### AdRequestConfig
Intended to capture all details of the requested ad. This will be combined with
previously joined interest groups prior to requesting an ad.

_Note: Information contained in this config will likely be altered, removed, or
made less unique during the anonymization process and may not reflect the exact
request the ad platform receives. This should be considered as **requested**
signals rather than required information._
```typescript
export class AdRequestConfig {
  // The origin that the anonymizing service request the ad bundle from. A
  // .well-known path, e.g. /.well-known/ad-request, will be queried by the
  // service.
  proxiedAnonymizingOrigin: string;
  // A set of properties whose names and values map to a well-known list of
  // supported values and help inform the ad network of what type of ad to serve.
  adProperties: AdProperties;
  //  The number identifier that represents a specific publisher's identity
  //  registered with the ad network.
  publisherCode: string;
  // The string identifier that represents an ad unit/vertical that the
  // publisher has registered with the ad network.
  publisherAdUnit: string;
  // Contextual targeting information for the ad.
  targeting: AdTargeting;
  // Specifies what information should be added or allowed to pass through with
  // the ad request by the anonymizing request service.
  anonymizedProxiedSignals: AnonymizedSignals[];
  // If anonymized ad request flows are not supported, either because of a
  // global decision, a local user decision, or due to an infrastructure outage,
  // this will be used to load the ad content as a fallback.
  fallbackSource: URL;
}
```

###### AdTargeting
Intended to represent the immediate, contextual, targeting information of the
desired ad. Geolocation information should be two number properties
representing the latitude and longitude (if provided).
```typescript
export class AdTargeting {
  // A list of interests specific to a given ad request. These may include
  // contextual signals made available at the time of the request.
  interests?: string[];
  // Geolocation information the requesting site may be aware of.
  geolocation?: number[];
}
```

###### AnonymizedSignals
The known/used anonymization signals that can be requested as part of a request.
If not included as part of an [AdRequestConfig](#AdRequestConfig) any
information under the specified category may be omitted.

e.g. if `targeting` is not included, then all targeting related information may
 be excluded.

```typescript
export type AnonymizedSignals = "coarse-geolocation" | "coarse-ua" | "targeting" | "user-ad-interests";
```


##### Methods

###### Navigator.createAdRequest

```typescript
  interface Navigator {
    createAdRequest: (config: AdRequestConfig) => Promise<URL>;
  }
```

This method is used to request a new ad with a given
[AdRequestConfig](#AdRequestConfig). The request will be sent to the PARAKEET
Service and, if successfully completed, the promise will resolve with an URL to
use as an iframe source. This is intended to mimic as closely as possible how
future interactions with fenced frames and an opaque source will function.

If an error occurs the promise will be rejected with a TypeError providing
relevant details.

###### Navigator.joinParakeetInterestGroup
This method is similar in function to other proposed
Navigator.joinAdInterestGroup methods referenced in other specs. We have opted
to use an interim name, joinParakeetInterestGroup, to help prevent collisions in
implementation and functionality while the APIs develop.

```typescript
  interface Navigator {
    joinParakeetInterestGroup: (interests: AdInterests, duration: number) => Promise<any>;
  }
```
This method can be used to join new [AdInterests](#AdInterests) for a given
duration. If the request succeeds the provided promise will be resolved and
otherwise will reject with a relevant TypeError.

As multiple join requests can be made it is possible for a given origin to end
up in a state where they have multiple joined interests that both 'expire' at
different times and have different sets of readers that are allowed to receive
those interests.

<br/>

##### Configuration Helpers

###### Parakeet.SetServeAds

```typescript
  interface Parakeet {
    SetServeAds(newState: boolean): void;
  }
```

This method is used to configure Parakeet to serve ads or not. When set to
false only JSON diagnostic data will be returned upon a successful createAdRequest
call.

###### Parakeet.SetStorageOrigin
This method is used to set the storage origin PARAKEET will use to securely
store and aggregate joined interest groups. Due to the nature of cross-origin
storage and this being built outside of the web platform this choice will impact
the scope of anonymization. If consumers choose to host their own storage silo
they will be anonymized by PARAKEET in isolation.

```typescript
  interface Parakeet {
    SetStorageOrigin(origin: URL): void;
  }
```

This should be set to the full URL that hosts the included **[frame.html](frame.html)** or
equivalent storage silo setup. This must be set prior to calling other PARAKEET
methods.

e.g.
```js
  Parakeet.SetStorageOrigin(new URL("https://edge.microsoft.com/parakeet/frame.html"));
```

**Note: This will not prevent namespacing of interest groups. Joined groups will
still be considered discrete from similar groups based on the origin in which
navigator.joinParakeetInterestGroup is called from.**

<br/>

###### Parakeet.ListenAsRemoteStorage
```typescript
  interface Parakeet {
    ListenAsRemoteStorage(): void;
  }
```
Helper to setup a frame to act as a remote storage silo. This should be called
in the common frame referenced by client calls to
[Parakeet.SetStorageOrigin](#parakeet.setstorageorigin).

<br/>

#### Examples

##### Host a PARAKEET storage 'silo'


Frame hosted on your CDN (e.g. https://your-site.example/remote-frame/frame.html):
```html
<!-- Setup a basic frame to act as a remote storage point for PARAKKET -->
<script src="parakeet.js"></script>
<script>Parakeet.ListenAsRemoteStorage();</script>
```

Client code wherever navigator.createAdRequest or navigator.joinParakeetInterestGroup
is called:
```html
  <script src="parakeet.js"></script>
  <script>
    // Setup Parakeet
    Parakeet.SetStorageOrigin(new URL("https://your-site.example/remote-frame/frame.html"));
    // Other calls to navigator.createAdRequest or navigator.joinParakeetInterestGroup are ready.
  </script>
```

<br/>

##### Join an interest group or two


```javascript

// Example script to run in DevTools to join a group:
let interests = new AdInterests(
  {"origin": "https://parakeet-consumer.example",
  "business":"Demo",
  "interests":["fun","times"],
  "readers":["bing.com","www.bing.com","foo.example"]});
// Join for one day.
navigator.joinParakeetInterestGroup(interests, 24*3600);

// or
// Join for two days.
navigator.joinParakeetInterestGroup({"origin": "https://parakeet-consumer.example",
  "business":"Demo Site",
  "interests":["demo","times"],
  "readers":["other.example", "foo.example"]}, 2*24*3600);

// Now https://parakeet-consumer.example has the following joined interest groups:
// Business Vanity Name: `Demo Site`
// Interest `fun`
//   Expires: in 1d
//   Allowed Readers: bing.com, www.bing.com, foo.example
// Interest `demo`
//   Expires: in 2d
//   Allowed Readers: other.example, foo.example
// Interest `times`
//   Expires: in 2d
//   Allowed Readers: bing.com, www.bing.com, other.example, foo.example
```

<br/>

##### Create an AdRequest and serve an ad

```javascript
navigator.createAdRequest({
   "proxiedAnonymizingOrigin": "www.bing.com",
   "adProperties": {
      "orientation": "landscape",
      "size": "medium",
      "slot": "div-xyz-abc",
      "lang": "en-us",
      "adtype": "image/native"
   },
   "publisherCode": "163898280",
   "publisherAdUnit": "375123",
   "targeting": {
      "interests": [
         "Lawn Mowers",
         "Shoes"
      ],
      "geolocation": [
         47.6397316,
         -122.1419026
      ]
   },
   "anonymizedProxiedSignals": [
      "coarse-geolocation",
      "targeting",
      "user-ad-interest"
   ],
   "fallbackSource": "https://www.bing.com/api/beta/v7/ads/native/search"
}).then(payload_uri => {
  let ad_frame = document.createElement("iframe");
  ad_frame.src = payload_uri;
  ad_frame.height = 700;
  ad_frame.width = 1024;

  let container = document.createElement("div");
  container.id = "ad-1234";
  // Set any other data for the ad/container as required.
  container.appendChild(ad_frame);

  document.body.appendChild(container);
}).catch(e => {
  console.log("AdRequest Error: " + e);
  debugger;
});
```
