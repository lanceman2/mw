function move(transNode) {

    var mat = x3dom.fields.SFMatrix4f.parseRotation('1 0 0 0');
    var z = Math.random()*2.0 - 1.0,
        y = Math.random()*2.0 - 1.0,
        x = Math.random()*2.0 - 1.0;
    var n = Math.sqrt(x*x + y*y + z*z);
            x /= n, y /= n, z /= n;

    // This is the rate at which we change the direction that
    // we are rotating.
    var rate = 0.02;
    setInterval(
        function(){
             // pick a random vector direction
            var rz = Math.random()*2.0 - 1.0,
                ry = Math.random()*2.0 - 1.0,
                rx = Math.random()*2.0 - 1.0;

            // Normalize this direction
            n = Math.sqrt(rx*rx + ry*ry + rz*rz);
            rx /= n, ry /= n, rz /= n;

            // change our direction a little in this direction
            x += rate*rx;
            y += rate*ry;
            z += rate*rz;

            // keep our direction normalized
            var n = Math.sqrt(x*x + y*y + z*z);
            x /= n, y /= n, z /= n;

            // make a "small rotation" rotation matrix that
            // rotates in this slightly changed direction.
            var rmat= x3dom.fields.SFMatrix4f.parseRotation( '' +
                x + ' ' + y + ' ' + z + ' 0.004');

            // Rotation
            mat = mat.mult(rmat);
            transNode.setFieldValue("matrix", mat);
        },
    10);
}

function hello(node) {

    var text = '';
    if(node) text = ' with name ' + node.nodeName;
    console.log("hello(node) called with node=" + node + text);
}
