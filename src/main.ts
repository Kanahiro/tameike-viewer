import maplibreGl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';

const gsiTerrainSource = useGsiTerrainSource(maplibreGl.addProtocol, {
    tileUrl: 'https://tiles.gsj.jp/tiles/elev/mixed/{z}/{y}/{x}.png',
    maxzoom: 17,
    attribution:
        '<a href="https://gbank.gsj.jp/seamless/elev/">産総研シームレス標高タイル</a>',
});
const map = new Map({
    container: 'app',
    zoom: 17,
    center: [135.104207, 34.866254],
    minZoom: 5,
    maxZoom: 24,
    pitch: 70,
    maxPitch: 85,
    hash: true,
    localIdeographFontFamily: false,
    style: {
        version: 8,
        glyphs: 'https://mierune.github.io/fonts/{fontstack}/{range}.pbf',
        sources: {
            seamlessphoto: {
                type: 'raster',
                tiles: [
                    'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
                ],
                maxzoom: 18,
                tileSize: 256,
                attribution:
                    '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
            },
            terrain: gsiTerrainSource,
            tameike: {
                type: 'vector',
                tiles: ['https://tiles.spatialty.io/tameikev1/{z}/{x}/{y}.pbf'],
                attribution:
                    '<a href="https://www.maff.go.jp/j/nousin/bousai/bousai_saigai/b_tameike/ichiran.html">農林水産省 - 農業用ため池一覧</a>',
                maxzoom: 17,
            },
            fude: {
                type: 'vector',
                tiles: ['https://tiles.spatialty.io/fude/{z}/{x}/{y}.pbf'],
                minzoom: 10,
                maxzoom: 14,
                attribution:
                    '「筆ポリゴンデータ（2023年度公開）」（農林水産省）を加工して作成',
            },
        },
        layers: [
            {
                id: 'seamlessphoto',
                source: 'seamlessphoto',
                type: 'raster',
            },
            {
                id: 'tameike-heatmap',
                source: 'tameike',
                'source-layer': 'tameike',
                type: 'heatmap',
                // use point_count as a heatmap weight
                paint: {
                    'heatmap-weight': ['coalesce', ['get', 'point_count'], 1],
                    'heatmap-intensity': 0.05,
                    'heatmap-radius': 20,
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        5,
                        0.7,
                        12,
                        0,
                    ],
                },
                maxzoom: 12,
            },
            {
                id: 'fude',
                source: 'fude',
                'source-layer': 'fudefgb',
                type: 'line',
                paint: {
                    'line-color': [
                        'match',
                        ['get', 'land_type'],
                        '100',
                        'blue',
                        '200',
                        'orange',
                        'green',
                    ],
                    'line-width': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10,
                        1,
                        14,
                        2,
                    ],
                },
            },
            {
                id: 'fude-fill',
                source: 'fude',
                'source-layer': 'fudefgb',
                type: 'fill',
                paint: {
                    'fill-color': [
                        'match',
                        ['get', 'land_type'],
                        '100',
                        '#00aaff',
                        '200',
                        'orange',
                        'green',
                    ],
                    'fill-opacity': 0.2,
                },
            },
            {
                id: 'tameike',
                source: 'tameike',
                'source-layer': 'tameike',
                type: 'circle',
                minzoom: 7,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        5,
                        2,
                        14,
                        6,
                    ],
                    'circle-color': '#ff5500',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                },
            },
            {
                id: 'tameike-label',
                source: 'tameike',
                'source-layer': 'tameike',
                type: 'symbol',
                minzoom: 14,
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        14,
                        14,
                        16,
                        20,
                    ],
                    'text-anchor': 'top',
                    'text-offset': [0, 1],
                    'text-font': ['LINESeedJP_OTF_Bd'],
                },
                paint: {
                    'text-color': '#000000',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2,
                },
            },
        ],
        terrain: {
            source: 'terrain',
            exaggeration: 1.2,
        },
    },
});

map.on('click', 'tameike', (e) => {
    if (!e.features) {
        return;
    }

    const feature = e.features[0];
    if (feature) {
        // @ts-ignore
        const coordinates = feature.geometry.coordinates.slice();
        const text = `${feature.properties.pref} ${feature.properties.city} ${
            feature.properties.address
        }<br />\
        ため池名: ${feature.properties.name}<br />\
        堤高: ${feature.properties.dam_height ?? '--'} m<br />\
        堤長: ${feature.properties.dam_length ?? '--'} m<br />\
        満水時面積: ${feature.properties.area ?? '--'} m²<br />\
        容量: ${feature.properties.capacity ?? '--'} m³`;
        new maplibreGl.Popup().setLngLat(coordinates).setHTML(text).addTo(map);
    }
});

map.on('mousemove', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['tameike'],
    });
    if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
    } else {
        map.getCanvas().style.cursor = '';
    }
});

map.on('click', 'fude', (e) => {
    if (!e.features) {
        return;
    }
    console.log(e.features);
});
