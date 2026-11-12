---
'@adrienlcp/react-aria': minor
---

The sheet leaves on a `sheet-fall` keyframe and its scrim on `sheet-scrim-out`, both on `$exit-easing`, instead of replaying the rise backwards: an ease-out reversed held the sheet still for most of its exit before dropping it. `$exit-easing` defaults to a curve that moves from the first frame and gathers speed.
