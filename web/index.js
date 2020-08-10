var canvas = this.__canvas = new fabric.Canvas('c');

var imageUrl = './gallery.jpg';
fabric.Image.fromURL("gallery.jpg", function (bgImage) {    
    //setCanvasZoom();

    var canvasAspect = canvas.width / canvas.height;
    var imgAspect = bgImage.width / bgImage.height;
    console.log(canvasAspect, imgAspect);
    console.log(bgImage.width, bgImage.height);
    var left, top, scaleFactor;
    if (canvasAspect >= imgAspect) {
        var scaleFactor = canvas.width / bgImage.width;
        left = 0;
        top = -((bgImage.height * scaleFactor) - canvas.height) / 2;
    } else {
        var scaleFactor = canvas.width / bgImage.width;
        console.log(scaleFactor, canvas.width);
        top = 0;
        left = -((bgImage.width * scaleFactor) - canvas.width) / 2;
    }
    console.log(scaleFactor * bgImage.width, scaleFactor *bgImage.height);
    canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas), {
        top: top,
        left: left,
        originX: 'left',
        originY: 'top',
        scaleX: scaleFactor,
        scaleY: scaleFactor
    });
    canvas.renderAll();
});
    
// create a polygon object
var points = [{
    x: 3, y: 4
}, {
    x: 16, y: 3
}, {
    x: 30, y: 5
},  {
    x: 25, y: 55
}];

var polygon = new fabric.Polygon(points, {
    left: 100,
    top: 50,
    fill: '#D81B60',
    opacity: 0.5,
    //strokeWidth: 1,
    //stroke: 'green',
    scaleX: 4,
    scaleY: 4,
    objectCaching: false,
    transparentCorners: true,
    cornerColor: 'blue',
});
//canvas.viewportTransform = [0.7, 0, 0, 0.7, -50, 50];
canvas.add(polygon);

// define a function that can locate the controls.
// this function will be used both for drawing and for interaction.
function polygonPositionHandler(dim, finalMatrix, fabricObject) {
  var x = (fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x),
        y = (fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y);
    return fabric.util.transformPoint(
        { x: x, y: y },
  fabric.util.multiplyTransformMatrices(
    fabricObject.canvas.viewportTransform,
    fabricObject.calcTransformMatrix()
  )
    );
}

// define a function that will define what the control does
// this function will be called on every mouse move after a control has been
// clicked and is being dragged.
// The function receive as argument the mouse event, the current trasnform object
// and the current position in canvas coordinate
// transform.target is a reference to the current object being transformed,
function actionHandler(eventData, transform, x, y) {
    var polygon = transform.target,
        currentControl = polygon.controls[polygon.__corner],
        mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
        polygonBaseSize = polygon._getNonTransformedDimensions(),
            size = polygon._getTransformedDimensions(0, 0),
            finalPointPosition = {
                x: mouseLocalPosition.x * polygonBaseSize.x / size.x + polygon.pathOffset.x,
                y: mouseLocalPosition.y * polygonBaseSize.y / size.y + polygon.pathOffset.y
            };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    //console.log(mouseLocalPosition);
    return true;
}

// define a function that can keep the polygon in the same position when we change its
// width/height/top/left.
function anchorWrapper(anchorIndex, fn) {
return function(eventData, transform, x, y) {
  var fabricObject = transform.target,
      absolutePoint = fabric.util.transformPoint({
          x: (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x),
          y: (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y),
      }, fabricObject.calcTransformMatrix()),
      actionPerformed = fn(eventData, transform, x, y),
      newDim = fabricObject._setPositionDimensions({}),
      polygonBaseSize = fabricObject._getNonTransformedDimensions(),
      newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
          newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y;
  fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
  return actionPerformed;
}
}

function Edit() {
    // clone what are you copying since you
    // may want copy and paste on different moment.
    // and you do not want the changes happened
    // later to reflect on the copy.
    var poly = canvas.getObjects()[0];
    canvas.setActiveObject(poly);
    poly.edit = !poly.edit;
    if (poly.edit) {
  var lastControl = poly.points.length - 1;
  poly.cornerStyle = 'circle';
  poly.cornerColor = 'rgba(0,0,255,0.5)';
    poly.controls = poly.points.reduce(function(acc, point, index) {
            acc['p' + index] = new fabric.Control({
                positionHandler: polygonPositionHandler,
                actionHandler: anchorWrapper(index > 0 ? index - 1 : lastControl, actionHandler),
                actionName: 'modifyPolygon',
                pointIndex: index
            });
            return acc;
        }, { });
    } else {
  poly.cornerColor = 'blue';
  poly.cornerStyle = 'rect';
        poly.controls = fabric.Object.prototype.controls;
    }
    poly.hasBorders = !poly.edit;
    canvas.requestRenderAll();
}

