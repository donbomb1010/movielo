// js/animations.js
document.addEventListener("DOMContentLoaded", () => {
    // Navbar Entry
    gsap.from("nav", {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power2.out"
    });

    // Hero Text Stagger
    gsap.from(".hero-content > *", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        delay: 0.5,
        ease: "power2.out"
    });

    // Row Entry
    gsap.from(".row", {
        x: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: ".row" // Requires ScrollTrigger plugin, simplified here for vanilla
    });
});