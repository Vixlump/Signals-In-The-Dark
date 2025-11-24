// World Map Visualization - Unique naming to prevent conflicts
const worldmapDataUrl = "dataset/scrubbed.csv";

function worldmapGetDecade(year) {
    return Math.floor(year / 10) * 10;
}

async function worldmapLoadData() {
    try {
        const raw = await d3.csv(worldmapDataUrl);

        const worldmapData = raw.map(d => {
            // Safely extract a 4-digit year anywhere in the datetime string
            const yearMatch = d.datetime.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? +yearMatch[0] : null;

            return {
                ...d,
                latitude: +d.latitude,
                longitude: +d.longitude,
                year: year,
                decade: year ? worldmapGetDecade(year) : null
            };
        });

        worldmapCreateDropdown(worldmapData);
        worldmapRenderMap(worldmapData);
    } catch (error) {
        console.error("Error loading world map data:", error);
        document.getElementById("worldmap-view").innerHTML = 
            "<p>Error loading visualization. Please check if the data file is available.</p>";
    }
}

function worldmapCreateDropdown(data) {
    const select = document.getElementById("worldmap-decade-select");

    // Remove rows with invalid (null) decades
    const decades = [...new Set(
        data.filter(d => d.decade !== null).map(d => d.decade)
    )].sort();

    select.innerHTML = `<option value="all">All Decades</option>`;

    decades.forEach(dec => {
        select.innerHTML += `<option value="${dec}">${dec}s</option>`;
    });

    select.addEventListener("change", () => {
        worldmapRenderMap(data);
    });
}

// RENDER WORLD MAP
async function worldmapRenderMap(allData) {
    const selected = document.getElementById("worldmap-decade-select").value;

    // Filter data by decade
    const worldmapFilteredData =
        selected === "all"
            ? allData.filter(d => d.year && d.latitude && d.longitude)
            : allData.filter(d => d.decade == selected && d.latitude && d.longitude);

    try {
        const world = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
            .then(res => res.json());

        const worldmapSpec = {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "width": 900,
            "height": 520,
            "projection": {
                "type": "equalEarth",
                "scale": 180,
                "translate": [450, 260]
            },
            "layer": [
                {
                    "data": {
                        "values": topojson.feature(world, world.objects.countries).features
                    },
                    "mark": {
                        "type": "geoshape",
                        "fill": "#1e2a47",
                        "stroke": "#999",
                        "strokeWidth": 0.5
                    }
                },
                {
                    "data": {
                        "values": worldmapFilteredData
                    },
                    "mark": {
                        "type": "circle",
                        "opacity": 0.7,
                        "stroke": "white",
                        "strokeWidth": 0.5
                    },
                    "encoding": {
                        "longitude": {
                            "field": "longitude",
                            "type": "quantitative"
                        },
                        "latitude": {
                            "field": "latitude", 
                            "type": "quantitative"
                        },
                        "color": {
                            "field": "year",
                            "type": "quantitative",
                            "scale": {
                                "scheme": "yellowgreenblue"
                            },
                            "legend": {
                                "title": "Year"
                            }
                        },
                        "size": {
                            "value": 40
                        },
                        "tooltip": [
                            {"field": "city", "title": "City"},
                            {"field": "state", "title": "State"},
                            {"field": "country", "title": "Country"},
                            {"field": "shape", "title": "Shape"},
                            {"field": "datetime", "title": "Date/Time"},
                            {"field": "year", "title": "Year"},
                            {"field": "duration (hours/min)", "title": "Duration"}
                        ]
                    }
                }
            ],
            "config": {
                "background": "transparent",
                "view": {
                    "stroke": "transparent"
                }
            }
        };

        vegaEmbed("#worldmap-view", worldmapSpec, { 
            "actions": false,
            "renderer": "canvas"
        });
    } catch (error) {
        console.error("Error rendering world map:", error);
        document.getElementById("worldmap-view").innerHTML = 
            "<p>Error rendering visualization. Please try again later.</p>";
    }
}

// Initialize the world map visualization
worldmapLoadData();