function lineIntersect (l = {x1:0, y1:0, x2:0, y2:0}, r = {x1:0, y1:0, x2:0, y2:0} /*r = {X1:0, Y1:0, X2:0, Y2:0, X3:0, Y3:0, X4:0, Y4:0}*/) {
	let a1 = {}; let a2 = {};
	a1.x = Math.min(l.x1, l.x2);
	a2.x = Math.max(l.x1, l.x2);
	a1.y = Math.min(l.y1, l.y2);
	a2.y = Math.max(l.y1, l.y2);
	return (
		AABBIntersect(a1,a2,{x:r.x1, y:r.y1},{x:r.x2, y:r.y2}) &&
		lineSegmentTouchesOrCrossesLine(l, r) &&
		lineSegmentTouchesOrCrossesLine(r, l)
	);
}

function AABBIntersect(a1, a2, b1, b2) {
	return (
		a1.x <= b2.x
    	&& a2.x >= b1.x
    	&& a1.y <= b2.y
		&& a2.y >= b1.y
	);
}

function pointOnLine(l, p) {
	let a = {x: l.x2 - l.x1, y: l.y2 - l.y1};
	let b = {x: p.x - l.x1, y: p.y - a.y1};
	let r = crossProduct(a, b);
	return Math.abs(r) < 0.000001;
}

function pointRightOfLine(l, p){
	let a = {x: l.x2 - l.x1, y: l.y2 - l.y1};
	let b = {x: p.x - l.x1, y: p.y - l.y1};
	return crossProduct(a, b) < 0;
}

function crossProduct(a, b){
	return (a.x*b.y) - (b.x*a.y);
}

function lineSegmentTouchesOrCrossesLine(a, b) {
	let r1 = pointRightOfLine(a, {x:b.x1, y:b.y1});
	let r2 = pointRightOfLine(a, {x:b.x2, y:b.y2});
	return(
		pointOnLine(a, {x:b.x1, y:b.y1}) ||
		pointOnLine(a, {x:b.x2, y:b.y2}) ||
		(( r1 && !r2 ) || ( !r1 && r2 ))
	);
}