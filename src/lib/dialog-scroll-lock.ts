let lockCount = 0;

function applyLockAttribute() {
	if (typeof document === "undefined") return;

	// Always lock body scroll (mobile path renders without our scroll root).
	const body = document.body;
	if (lockCount > 0) {
		if (!body.dataset.prevOverflow) {
			body.dataset.prevOverflow = body.style.overflow || "";
		}
		body.style.overflow = "hidden";
	} else {
		body.style.overflow = body.dataset.prevOverflow ?? "";
		delete body.dataset.prevOverflow;
	}

	if (lockCount > 0) {
		document.documentElement.setAttribute("data-dialog-scroll-lock", "true");
	} else {
		document.documentElement.removeAttribute("data-dialog-scroll-lock");
	}
}

export const lockDialogScroll = () => {
	lockCount += 1;
	applyLockAttribute();
};

export const unlockDialogScroll = () => {
	lockCount = Math.max(0, lockCount - 1);
	applyLockAttribute();
};
