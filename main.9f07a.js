window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;

    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay() {
        // Loading splash scene
        onProgress = function (finish, total) {
            var percent = (100 * finish) / total;
            console.log(`percent: ${percent}%`);
        };
    }

    var onStart = function () {
        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === "landscape") {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            } else if (settings.orientation === "portrait") {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen(false);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 10;
            cc.assetManager.downloader.maxRequestsPerFrame = 6;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });

        bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
            if (err) {
                console.error(`load scene:`, err);
            }

            cc.director.runSceneImmediate(scene);

            if (!cc.sys.isBrowser) {
                console.warn(`is not browser`);
                return;
            }

            // show canvas
            var canvas = document.getElementById("GameCanvas");
            canvas.style.visibility = "";
            var div = document.getElementById("GameDiv");
            if (div) {
                div.style.backgroundImage = "";
            }
            console.log("Success to load scene: " + launchScene);
        });
    };

    var option = {
        id: "GameCanvas",
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server,
    });

    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb(err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(
        settings.jsList.map(function (x) {
            return "src/" + x;
        }),
        cb
    );

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = typeof loadRuntime === "function";
    if (isRuntime) {
        require("src/settings.7b5eb.js");
        require("src/cocos2d-runtime.js");
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require("src/physics.js");
        }
        require("jsb-adapter/engine/index.js");
    } else {
        require("src/settings.7b5eb.js");
        require("src/cocos2d-jsb.js");
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require("src/physics.js");
        }
        require("jsb-adapter/jsb-engine.js");
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}
