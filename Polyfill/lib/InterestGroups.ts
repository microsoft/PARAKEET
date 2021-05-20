// Copyright (C) Microsoft Corporation. All rights reserved.

import { AdInterests } from './AdInterests';

/**
 * Helper to store an AdInterest |parsedInterests| that has been validated
 * as an AdInterest in localStorage for the current origin.
 * Each interest will be stored along with an updated |duration| indicating
 * how long it is valid for along with the current set of readers that are
 * allowed to view that interest.
 * 
 * Over time and multiple calls to store interests a given origin may end
 * up with multiple interests that have differing durations and readers.
 * 
 * @param parsedInterests
 * @param duration
 * @param secureOrigin
*/
export function StoreInterestGroup(parsedInterests: AdInterests, duration: number, secureOrigin: string) {
  const rawStoredInterests = localStorage.getItem("storedInterests");
  // Convert our stored interests from a flat string into an object we
  // can modify and amend easier.
  let storedInterests = JSON.parse(rawStoredInterests ? rawStoredInterests : "{}");

  if (!storedInterests) {
    throw new TypeError("Error retrieving stored interests. Clear localStorage.");
  }

  // Namespace by our secureOrigin, provided by our API, not the one in
  // parsedInterests.
  if (!storedInterests[secureOrigin]) {
    storedInterests[secureOrigin] = {};
  }

  // Merge in any new interests we have an update any associated
  // properties.

  // We'll take the latest business name and clobber any previous one
  // as this is a vanity thing only.
  if (parsedInterests.business) {
    storedInterests[secureOrigin]["business"] = parsedInterests.business;
  }

  if (!storedInterests[secureOrigin]["interests"]) {
    storedInterests[secureOrigin]["interests"] = {};
  }

  parsedInterests.interests.forEach(function (interest) {
    if (!storedInterests[secureOrigin]["interests"][interest]) {
      storedInterests[secureOrigin]["interests"][interest] = {};
    }

    // If a previous expiration exists we don't care, the new one is our
    // limit.
    storedInterests[secureOrigin]["interests"][interest].expiration = (new Date().getTime() / 1000) + duration;

    if (!storedInterests[secureOrigin]["interests"][interest].readers) {
      storedInterests[secureOrigin]["interests"][interest].readers = [];
    }

    // For ease of access, store each reader along with the interest as multiple
    // joins could lead to different readers for different interests over time.
    parsedInterests.readers.forEach(function (reader) {
      if (!storedInterests[secureOrigin]["interests"][interest].readers.includes(reader)) {
        storedInterests[secureOrigin]["interests"][interest].readers.push(reader);
      }
    });
  });

  // interests representations are currently ignored due to lack of client
  // side support.

  // Now flatten our object and store it in localstorage for later use.
  localStorage.storedInterests = JSON.stringify(storedInterests);
}

/**
 * Helper to get all current/non-expired interest groups for the current storage 
 * origin. The current date/time and |reader| will be used to filter out any
 * expired interests or ones not intended for this destination.
 *
 * All interests are sent to the Parakeet server so proper encryption and
 * anonymization can occur.
 */
export function GetInterestGroups() {
  const rawStoredInterests = localStorage.getItem("storedInterests");
  // Convert our stored interests from a flat string into an object we
  // can modify and amend easier.
  const storedInterests = JSON.parse(rawStoredInterests ? rawStoredInterests : "{}");

  if (!storedInterests) {
    throw new TypeError("Error retrieving stored interests. Clear localStorage.");
  }

  // We want to generate a format for PARAKEET to be able to process per-reader.
  // e.g.
  // reader1: {
  //   interests: {
  //     origin1: [interest1, interest2, ...],
  //     origin2: [interest1, interestA, ...],
  //   }
  // },
  // reader2: {
  // ...

  let joinedInterests: { [x: string]: { [x: string]: { [x: string]: string[]; }; }; } = {};
  const currentTimeInSeconds = (new Date().getTime() / 1000);
  Object.keys(storedInterests).forEach(function (namespacedInterestGroup) {
    Object.keys(storedInterests[namespacedInterestGroup]["interests"]).forEach(function (interest: string) {
      // If this specific interest is not yet expired we can add it to our list.
      if (storedInterests[namespacedInterestGroup]["interests"][interest].expiration > currentTimeInSeconds) {
        // Make sure to add this for each reader specified.
        Object.keys(storedInterests[namespacedInterestGroup]["interests"][interest].readers).forEach(function (reader) {
          const readerName = storedInterests[namespacedInterestGroup]["interests"][interest].readers[reader];
          // Ensure our root reader node exists.
          if (!joinedInterests[readerName]) {
            joinedInterests[readerName] = {};
          }

          // Ensure we have an 'interests' index to look/add to.
          if (!joinedInterests[readerName]["interests"]) {
            joinedInterests[readerName]["interests"] = {};
          }

          // This may be the first time we're seeing this specific origin, so ensure it is available.
          if (!joinedInterests[readerName]["interests"][namespacedInterestGroup]) {
            joinedInterests[readerName]["interests"][namespacedInterestGroup] = [];
          }

          // Now add this interest within the origin (namespace) for the given reader.
          joinedInterests[readerName]["interests"][namespacedInterestGroup].push(interest);
        });
      }
    });
  });

  return joinedInterests;
}