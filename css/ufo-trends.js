document.addEventListener("DOMContentLoaded", () => {

  const spec = {
    width: "container",
    height: 700,
    background: "#0A1225",

    autosize: {
      type: "fit",
      contains: "padding"
    },

    padding: { top: 30, right: 40, bottom: 100, left: 10 },

    data: { url: "dataset/scrubbedline.csv" },

    transform: [
      { calculate: "year(toDate(datum.datetime))", as: "year" },
      { filter: "datum.year != null && datum.country != null && datum.country != ''" },
      { filter: "datum.year >= 1946" },
      {
        aggregate: [{ op: "count", as: "sightings" }],
        groupby: ["year", "country"]
      },
      {
        window: [{ op: "rank", as: "rank" }],
        sort: [
          { field: "year" },
          { field: "sightings", order: "descending" }
        ],
        groupby: ["year"]
      },
      { filter: "datum.rank <= 5" }
    ],

    mark: {
      type: "line",
      strokeWidth: 3,
      point: { filled: true, size: 70 }
    },

    encoding: {
      x: {
        field: "year",
        type: "quantitative",
        title: "Year",
        axis: { format: "d", labelColor: "white", titleColor: "white" }
      },

      y: {
        field: "sightings",
        type: "quantitative",
        title: "Number of Sightings",
        axis: { labelColor: "white", titleColor: "white" }
      },

      color: {
        field: "country",
        type: "nominal",
        legend: {
          title: "Country (Click to Filter)",
          labelColor: "white",
          titleColor: "white",
          orient: "bottom"
        }
      },

      tooltip: [
        { field: "year", title: "Year" },
        { field: "country", title: "Country" },
        { field: "sightings", title: "Sightings", format: ".0f" }
      ]
    },

    selection: {
      country_select: {
        type: "multi",
        fields: ["country"],
        bind: "legend"
      }
    },

    opacity: {
      condition: { selection: "country_select", value: 1 },
      value: 0.2
    }
  };

  vegaEmbed("#ufo-trends-view", spec, {
    actions: false,
    theme: "dark",
    renderer: "svg"   // 🔑 THIS FIXES TOOLTIPS
  });

});
