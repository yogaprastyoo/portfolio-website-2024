// ** Navigation Button **
const goto = (id) => document.getElementById(id).scrollIntoView();

document.addEventListener("click", (e) => {
	const target = e.target.closest(".link-to");
	if (target) {
		const targetId = target.dataset.targetId;
		if (targetId) {
			goto(targetId);
		}
	}
});

// ** Cursor Ring **
const cursorRing = document.getElementById("cursor-ring");
const easingFactor = 0.2;
let isMouseMoving = false;

function showCursor() {
	cursorRing.style.display = "block";
	document.addEventListener("mousemove", onMouseMove);
}

function onMouseMove(e) {
	targetX = e.clientX;
	targetY = e.clientY;
	isMouseMoving = true;
}

function updateCursor() {
	if (isMouseMoving) {
		const currentX = parseFloat(cursorRing.style.left) || 0;
		const currentY = parseFloat(cursorRing.style.top) || 0;
		const deltaX = (targetX - currentX) * easingFactor;
		const deltaY = (targetY - currentY) * easingFactor;
		cursorRing.style.left = `${currentX + deltaX}px`;
		cursorRing.style.top = `${currentY + deltaY}px`;

		isMouseMoving = Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1;
	}
	requestAnimationFrame(updateCursor);
}

function toggleCursor() {
	cursorRing.classList.toggle("active");
}

document.addEventListener("mouseenter", showCursor);
document.addEventListener("mousedown", toggleCursor);
document.addEventListener("mouseup", toggleCursor);

updateCursor();

// ** Scroll to Top Button **
const buttonScrollToTop = document.querySelector(".scroll-top");

document.addEventListener("scroll", function () {
	if (window.scrollY > window.innerHeight * 0.9) {
		buttonScrollToTop.style.visibility = "visible";
	} else {
		buttonScrollToTop.style.visibility = "hidden";
	}
});

buttonScrollToTop.addEventListener("click", () => {
	buttonScrollToTop.classList.add("active");
	window.scrollTo({
		top: 0,
		behavior: "smooth",
	});
});

// ** Date Display **
const currentDate = new Date();
const day = String(currentDate.getDate()).padStart(2, "0");
const month = String(currentDate.getMonth() + 1).padStart(2, "0");
const year = currentDate.getFullYear();

const dateElement = document.getElementById("date");
const yearElements = document.querySelectorAll(".year");

dateElement.innerText = `${day}. ${month}. ${year}`;

yearElements.forEach((element) => {
	element.textContent = year;
});
