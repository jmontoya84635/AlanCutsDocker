document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#first-item").classList.add("active");
    document.getElementById("view-work-btn").addEventListener("click", (event) => {
        event.preventDefault();
        const examplesSection = document.getElementById("examples");
        window.scrollTo({
            top: examplesSection.offsetTop - 50, behavior: "smooth",
        });
    });
});