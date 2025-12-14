const worldmapDataUrl =
  "https://vixlump.github.io/Signals-In-The-Dark/dataset/scrubbed.csv";


function worldmapGetDecade(year) {
  return Math.floor(year / 10) * 10;
}


async function worldmapLoadData() {
  const raw = await d3.csv(worldmapDataUrl);

  const data = raw.map(d => {
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

  worldmapSetupSlider(data);
  worldmapRenderMap(data);
}


function worldmapSetupSlider(data) {
  const slider = document.getElementById("worldmap-decadeSlider");
  const checkbox = document.getElementById("worldmap-allDecades");
  const label = document.getElementById("worldmap-decadeLabel");

  // Update label text
  label.textContent = `${slider.value}s`;

  slider.addEventListener("input", () => {
    label.textContent = `${slider.value}s`;
    worldmapRenderMap(data);
  });

  checkbox.addEventListener("change", () => {
    worldmapRenderMap(data);
  });
}


async function worldmapRenderMap(allData) {
  const slider = document.getElementById("worldmap-decadeSlider");
  const checkbox = document.getElementById("worldmap-allDecades");

  const filteredData = checkbox.checked
    ? allData.filter(d => d.year)
    : allData.filter(d => d.decade == slider.value);

  const world = await fetch(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
  ).then(res => res.json());

  const spec = {
    width: 900,
    height: 520,
    background: "transparent",
   

    projection: {
      type: "mercator",
      center: [0, 20],
      scale: 120,
      translate: [450, 260]
    },

    layer: [
      /* ------------------------------------------
         World map background
      ------------------------------------------ */
      {
        data: {
          values: topojson.feature(
            world,
            world.objects.countries
          ).features
        },
        mark: {
          type: "geoshape",
          fill: "#0a1429",
          stroke: "#4a6fcc",
          strokeWidth: 1.2
        }
      },

      /* ------------------------------------------
         UFO points
      ------------------------------------------ */
      {
        data: { values: filteredData },

        mark: {
          type: "circle",
          opacity: 0.85,
          stroke: "#50E3C2",
          strokeWidth: 1.2,
          strokeOpacity: 0.8
        },

        encoding: {
          longitude: {
            field: "longitude ",
            type: "quantitative"
          },

          latitude: {
            field: "latitude",
            type: "quantitative"
          },

          color: {
            field: "year",
            type: "quantitative",
            scale: {
              scheme: "viridis",
              domain: [1940, 2020]
            },
            legend: {
              title: "Sighting Year",
              titleColor: "#8ab4ff",
              labelColor: "#b0c4ff",
              orient: "bottom-right",
              titleFontSize: 14,
              labelFontSize: 11,
              gradientLength: 300,
              gradientThickness: 20,
              titlePadding: 10,
              offset: 10
            }
          },

         
          size: {
            value: 15 
          },

          tooltip: [
            { field: "city", title: "City" },
            { field: "shape", title: "Shape" },
            { field: "datetime", title: "Date/Time" },
            { field: "year", title: "Year" },
            { field: "country", title: "Country" }
          ]
        }
      }
    ],

    config: {
      background: "transparent",
      view: { stroke: "transparent" },

      axis: {
        domainColor: "#6a9eff",
        gridColor: "rgba(106, 158, 255, 0.3)",
        tickColor: "#6a9eff",
        labelColor: "#b0c4ff",
        titleColor: "#8ab4ff"
      },

      legend: {
        labelColor: "#b0c4ff",
        titleColor: "#8ab4ff",
        titleFontSize: 14,
        labelFontSize: 11
      }
    }
  };

  vegaEmbed("#worldmap-view", spec, {
    actions: false,
    theme: "dark"
  });
}


document.addEventListener("DOMContentLoaded", () => {
  worldmapLoadData();
});
