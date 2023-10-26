/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 320:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 605:
/***/ ((module) => {

module.exports = eval("require")("execa");


/***/ }),

/***/ 559:
/***/ ((module) => {

module.exports = eval("require")("plist");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
// MIT License - Copyright (c) 2020 Stefan Arentz <stefan@devbots.xyz>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


const fs = __nccwpck_require__(147);

const core = __nccwpck_require__(320);
const execa = __nccwpck_require__(605);
const plist = __nccwpck_require__(559);


const sleep = (ms) => {
    return new Promise(res => setTimeout(res, ms));
};


const parseConfiguration = () => {
    const configuration = {
        productPath: core.getInput("product-path", {required: true}),
        username: core.getInput("appstore-connect-username", {required: true}),
        teamid: core.getInput("appstore-connect-teamid", {required: true}),
        password: core.getInput("appstore-connect-password", {required: true}),
        verbose: core.getInput("verbose") === "true",
    };

    if (!fs.existsSync(configuration.productPath)) {
        throw Error(`Product path ${configuration.productPath} does not exist.`);
    }

    return configuration
};


const archive = async ({productPath}) => {
    const archivePath = "/tmp/archive.zip"; // TODO Temporary file

    const args = [
        "-c",           // Create an archive at the destination path
        "-k",           // Create a PKZip archive
        "--keepParent", // Embed the parent directory name src in dst_archive.
        productPath,    // Source
        archivePath,    // Destination
    ];

    try {
        await execa("ditto", args);
    } catch (error) {
        core.error(error);
        return null;
    }

    return archivePath;
};


const submit = async ({archivePath, username, teamid, password, verbose}) => {
    //
    // Run notarytool to notarize this application. This only submits the
    // application to the queue on Apple's server side. It does not
    // actually tell us if the notarization was succesdful or not, for
    // that we need to poll using the request UUID that is returned.
    //

    const args = [
        "notarytool",
        "submit",
        "--wait",
        "--apple-id", username,
        "--team-id", teamid,
        "--password", password,
        archivePath
    ];

    if (verbose === true) {
        args.push("--verbose");
    }

    let xcrun = execa("xcrun", args, {reject: false});

    xcrun.stdout.pipe(process.stdout);
    xcrun.stderr.pipe(process.stderr);

    const {exitCode, stdout, stderr} = await xcrun;

    if (exitCode === undefined) {
        // TODO Command did not run at all
        throw Error("Unknown failure - notarytool did not run at all?");
    }

    if (exitCode !== 0) {
        const response = JSON.parse(stdout);
        if (verbose === true) {
            console.log("STDERR", stderr);
            console.log(response);
        }

        for (const productError of response["product-errors"]) {
            core.error(`${productError.code} - ${productError.message}`);
        }
        return false;
    }

    return true;
};

const main = async () => {
    try {
        const configuration = parseConfiguration();

        const archivePath = await core.group('Archiving Application', async () => {
            const archivePath = await archive(configuration)
            if (archivePath !== null) {
                core.info(`Created application archive at ${archivePath}`);
            }
            return archivePath;
        });

        if (archivePath == null) {
            core.setFailed("Notarization failed");
            return;
        }

        const success = await core.group('Waiting for Notarization Status', async () => {
            return await submit({archivePath: archivePath, ...configuration})
        });

        if (success == false) {
            core.setFailed("Notarization failed");
            return;
        }

        core.setOutput('product-path', configuration.productPath);
    } catch (error) {
        core.setFailed(`Notarization failed with an unexpected error: ${error.message}`);
    }
};


main();

})();

module.exports = __webpack_exports__;
/******/ })()
;