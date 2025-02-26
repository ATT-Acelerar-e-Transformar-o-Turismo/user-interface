import React from "react";

const Carousel = ({ images = [] }) => {
  if (!Array.isArray(images)) {
    return null;
  }

  return (
    <div className="carousel w-full">
      {images.map((image, index) => (
        <div
          key={index}
          id={`slide${index}`}
          className="carousel-item relative w-full aspect-[4/1] overflow-hidden rounded-lg bg-base-200"
        >
          <img src={image} className="w-full h-full object-cover" alt={`Slide ${index}`} />
          <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
            <a href={`#slide${index === 0 ? images.length - 1 : index - 1}`} className="btn btn-circle">
              ❮
            </a>
            <a href={`#slide${index === images.length - 1 ? 0 : index + 1}`} className="btn btn-circle">
              ❯
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Carousel;
