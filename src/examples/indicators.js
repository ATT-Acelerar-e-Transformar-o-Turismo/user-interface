const exampleIndicators = [
  {
    id: 1,
    name: "GDP Growth Rate",
    periodicity: "Monthly",
    domain: "Economia",
    favourites: 3,
    governance: true,
    description: "The GDP growth rate measures how fast the economy is growing.",
    font: "Arial",
    scale: "Percentage"
  },
  {
    id: 2,
    name: "Unemployment Rate",
    periodicity: "Weekly",
    domain: "Economia",
    favourites: 5,
    governance: false,
    description: "The unemployment rate measures the percentage of the labor force that is jobless.",
    font: "Times New Roman",
    scale: "Percentage"
  },
  {
    id: 3,
    name: "Literacy Rate",
    periodicity: "Monthly",
    domain: "Sociedade",
    favourites: 0,
    governance: true,
    description: "The literacy rate measures the percentage of people who can read and write.",
    font: "Verdana",
    scale: "Percentage"
  },
  {
    id: 4,
    name: "Carbon Emissions",
    periodicity: "Yearly",
    domain: "Ambiente",
    favourites: 2,
    governance: false,
    description: "Carbon emissions measure the amount of carbon dioxide released into the atmosphere.",
    font: "Helvetica",
    scale: "Metric Tons"
  },
];

export default exampleIndicators;
