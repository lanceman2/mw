// Creates a subscription that writes the navigation 6 floats from 
// the particular browser client that loads this javaScript and
// creates and sets up an avator 


(function() {


    var pre = mw_getCurrentScriptPrefix();

    // document.currentScript is not defined in callbacks so we get the
    // script options here now, like so:
    var opts = mw_getScriptOpts();
    var mw = opts.mw;

    mw_assert(mw, 'mw client object not passed to' +
            pre+'clientNavigationFollow.js');

    function subscribe() {

        console.log('nav subscribe()');
    }

    if(typeof opts.avatorUrl === 'undefined' || opts.avatorUrl === null)
        // Default avatar
        opts.avatorUrl = pre+'../actor/avatar/teapot.x3d';

    mw_addActor(opts.avatorUrl, function(transformNode) {

        // The avatar is loaded now under this transform Node.

        transformNode.setAttribute("translation", "0 0 5");

        mw.Send('create nav substription');
        
        },{
            containerNodeType: 'Transform'
        }
    );

    console.log(pre+'clientNavigationFollow.js running');
})();
