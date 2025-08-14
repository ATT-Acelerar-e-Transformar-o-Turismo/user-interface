// Mock data based on real API responses
export const MOCK_DOMAINS = [
  {
    name: "Environment",
    color: "#00FF00",
    image: "https://example.com/image.jpg",
    subdomains: [
      "Natural capital and land use",
      "Climate change",
      "Air quality"
    ],
    id: "6882aed21331d722c9da1f60",
    DomainCarouselImages: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  },
  {
    name: "Economy",
    color: "#FF0000",
    image: "https://example.com/economy.jpg",
    subdomains: [
      "Economic performance",
      "Tourism development"
    ],
    id: "6882aed21331d722c9da1f61",
    DomainCarouselImages: [
      "https://example.com/economy1.jpg",
      "https://example.com/economy2.jpg"
    ]
  },
  {
    name: "Society",
    color: "#0000FF",
    image: "https://example.com/society.jpg",
    subdomains: [
      "Social well-being",
      "Community engagement"
    ],
    id: "6882aed21331d722c9da1f62",
    DomainCarouselImages: [
      "https://example.com/society1.jpg",
      "https://example.com/society2.jpg"
    ]
  }
];

export const MOCK_INDICATORS = [
  {
    name: "Presence of endemic plants and rare animals",
    periodicity: "annual",
    favourites: 0,
    governance: true,
    description: "Biodiversity indicator measuring the presence of endemic plants and rare animals in the region",
    font: "CM Ílhavo",
    scale: "local",
    id: "6882aed71331d722c9da1f61",
    domain: "6882aed21331d722c9da1f60",
    subdomain: "Natural capital and land use",
    resources: [],
    characteristics: {
      unit_of_measure: "units",
      source: "CM Ílhavo",
      periodicity: "annual"
    },
    categorization: "Biodiversity"
  },
  {
    name: "Protected species in destination",
    periodicity: "annual",
    favourites: 0,
    governance: true,
    description: "Indicator measuring the number of protected species in the destination",
    font: "CM Ílhavo",
    scale: "local",
    id: "6882aed71331d722c9da1f62",
    domain: "6882aed21331d722c9da1f60",
    subdomain: "Natural capital and land use",
    resources: [],
    characteristics: {
      unit_of_measure: "species",
      source: "CM Ílhavo",
      periodicity: "annual"
    },
    categorization: "Biodiversity"
  },
  {
    name: "Percentage of area designated for tourism purposes",
    periodicity: "annual",
    favourites: 0,
    governance: true,
    description: "Indicator measuring the percentage of area designated for tourism purposes",
    font: "CM Ílhavo",
    scale: "local",
    id: "6882aed71331d722c9da1f63",
    domain: "6882aed21331d722c9da1f60",
    subdomain: "Natural capital and land use",
    resources: [],
    characteristics: {
      unit_of_measure: "percentage",
      source: "CM Ílhavo",
      periodicity: "annual"
    },
    categorization: "Land Use"
  }
];

// Mock data for specific test scenarios
export const MOCK_EMPTY_INDICATORS = [];

export const MOCK_ERROR_RESPONSE = {
  error: "Internal server error",
  message: "Something went wrong"
}; 