# Japan map attribution

## Current geographic map

`src/lib/geographic-map.js` contains Japan's 47 prefectures from [Natural Earth Admin 1, 1:10m](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/). Natural Earth vector data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/).

Source: `nvkelso/natural-earth-vector`, revision `117488dc884bad03366ff727eca013e434615127`, `geojson/ne_10m_admin_1_states_provinces.geojson`. Rebuild with `python3 scripts/build-geographic-map.py /path/to/source.geojson`. The generator filters Japan, simplifies rings at 0.002 degrees, and uses an equirectangular projection: `x=(longitude-122)*18`, `y=(46-latitude)*22`. This same projection positions search results, without fitting real locations to an unrelated illustration. Islands are not moved into insets. Some small islands and coastline details are absent; this is not a navigation map.

## Place search

Place candidates come from [Photon](https://photon.komoot.io/) and © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the Open Database License. Attribution is visible beside search. The [Photon demo server policy](https://github.com/komoot/photon#demo-server) permits reasonable project use without an availability guarantee; requests are explicit, rate-limited in the client, and session-cached. No OSMF Nominatim API is used. A higher-traffic deployment should use its own Photon instance or a hosted provider.

## Previous illustration (kept for backup compatibility)

The prefecture outlines in `src/lib/japan-map.js` are adapted from [svg-maps Japan](https://github.com/VictorCazanave/svg-maps/tree/master/packages/japan), based on the work of [MapSVG](https://mapsvg.com/maps/japan).

Source revision: `c19b55f9af9021e022f2af13b317eff320f22102` (`packages/japan/index.js`).

The map data is licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). This license applies to the map data, not to unrelated application code.

Changes: relative SVG path commands were converted into polygon coordinates; Japanese prefecture names were added. The app changes the map's colors and framing, and overlays buildings and nature. This is a simplified illustration, not a surveying or navigation map; some small islands are omitted in the source.
