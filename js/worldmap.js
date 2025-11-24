const worldmapDataUrl = "https://vixlump.github.io/Signals-In-The-Dark/dataset/scrubbed.csv";

function worldmapGetDecade(year) {
    return Math.floor(year / 10) * 10;
}

async function worldmapLoadData() {
    const raw = await d3.csv(worldmapDataUrl);

    const data = raw.map(d => {
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

    worldmapCreateDropdown(data);
    worldmapRenderMap(data);
}

function worldmapCreateDropdown(data) {
    const select = document.getElementById("worldmap-decadeSelect");

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

// RENDER MAP - EXACT ORIGINAL CODE, just renamed function
async function worldmapRenderMap(allData) {
    const selected = document.getElementById("worldmap-decadeSelect").value;

    // Filter data by decade
    const filteredData =
        selected === "all"
            ? allData.filter(d => d.year)
            : allData.filter(d => d.decade == selected);

    const world = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
        .then(res => res.json());

    const spec = {
        width: 900,
        height: 520,

        projection: {
            type: "mercator",
            center: [0, 20],       
            scale: 120,            
            translate: [450, 260]  
        },

        layer: [
            // --- MAP BACKGROUND ---
            {
                data: {
                    values: topojson.feature(world, world.objects.countries).features
                },
                mark: {
                    type: "geoshape",
                    fill: "#1e2a47",
                    stroke: "#999"
                }
            },

            // --- UFO POINTS ---
            {
                data: { values: filteredData },
                mark: {
                    type: "circle",
                    opacity: 0.9
                },
                encoding: {
                    longitude: { field: "longitude ", type: "quantitative" },
                    latitude:  { field: "latitude",  type: "quantitative" },

                    color: {
                        field: "year",
                        type: "quantitative",
                        scale: { scheme: "yellowgreenblue" }
                    },

                    size: { value: 70 },

                    tooltip: [
                        { field: "city",     title: "City" },
                        { field: "shape",    title: "Shape" },
                        { field: "datetime", title: "Date/Time" },
                        { field: "year",     title: "Year" }
                    ]
                }
            }
        ]
    };

    vegaEmbed("#worldmap-view", spec, { actions: false });
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    worldmapLoadData();
});