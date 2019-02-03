window.onload = () => {
    FAVICON.init();
};

var FAVICON = (function ($, window, document) {

    if (!$) return;

    var SELF = {
        init: () => {
            SELF.actions.replaceColor();
            SELF.actions.initTabs();
            SELF.actions.bind();
        },
        actions: {
            bind: () => {

                const $btnSaveIcons = $("#btnSaveIcons");

                $("#color").change((event) => {
                    SELF.actions.replaceColor(event.target.value);
                });
                
                $("#select").change((event) => {
                    const file = event.target.files[0];

                    $("#html span").text(file.value); 
                    $btnSaveIcons.removeClass("disabled").addClass(file ? "" : "disabled");
                    SELF.actions.showPreviewFavicons(file);
                });

                $("#btnSaveHtmlFile").click(() => {
                    SELF.actions.saveToDiskText("#html", "head.html");
                });
                
                $("#btnSaveXmlFile").click(() => {
                    SELF.actions.saveToDiskText("#xml","browserconfig.xml");
                });
                
                $btnSaveIcons.click(() => {
                    SELF.actions.saveToDiskImage();
                });
            },
            getBase64Image(img) {
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                var dataURL = canvas.toDataURL("image/png");

                return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
            },
            initTabs() {
                $('ul.tabs').tabs();
            },
            replaceColor(color) {
                color = color || $("#color").val();

                $("#divPreview .divContentFaviconList .divContentFavicon").css("background-color", `#${color}`); 
                $("#xml output, #html output").text(`#${color}`); 
            },
            showPreviewFavicons(file) {
                const divPreview = document.getElementById("divPreview");
                divPreview.innerHTML = "";
            
                if(!file)return;

                [228, 196, 180, 150, 144, 128, 96, 76, 70, 57, 32].forEach((size) => {
                    ImageTools.resize(file, { width: size, height: size }, (blob, isResizeOk) => {
                        const src = window.URL.createObjectURL(blob);
                        SELF.actions.addImageToList(divPreview, size, src);
                    });
                });
            },
            addImageToList(divPreview, size, src) {
                const color = $("#color").val();

                let html = `
                    <div class="divContentFaviconList" class="col m3 s3">
                        <p>Size: ${size}</p>    
        
                        <div class="divContentFavicon" style="background-color: #${color};">
                            <img src="${src}" id="favicon-${size}.png" class="preview" title="Size: ${size}" />
                        </div>
                    </div>
                `;
    
                divPreview.innerHTML += html;
            },
            stringToBytes(str)  {
                let bytes = new Uint8Array(str.length);
                for (let i = 0; i < str.length; i++) {
                    bytes[i] = str.charCodeAt(i);
                }
                return bytes;
            },
            saveToDiskText: (target, filename) => {
                const filebody = $(target).text(), 
                    file = new File([filebody], filename, {type: "text/plain;charset=utf-8"});

                saveAs(file);
            },
            saveToDiskImage: (filename) => {
                const $imgs = $("#divPreview .preview"),
                    canvas = document.getElementById("faviconCanvas");

                let zip = new JSZip();

                $imgs.each((index, img) => {
                    zip.file(img.id, SELF.actions.getBase64Image(img), {base64: true});
                }).promise().done(function () { 
                    zip.generateAsync({type: 'blob'}).then(content => {
                        saveAs(content, 'favicons.zip');
                    });
                });
            }
        }
    };

    return {
        init: SELF.init
    };

})(jQuery, window, document);




if (typeof exports === "undefined") {
    var exports = {};
}

if (typeof module === "undefined") {
   var module = {};
}

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var hasBlobConstructor = typeof Blob !== 'undefined' && (function () {
    try {
        return Boolean(new Blob());
    } catch (e) {
        return false;
    }
})();

var hasArrayBufferViewSupport = hasBlobConstructor && typeof Uint8Array !== 'undefined' && (function () {
    try {
        return new Blob([new Uint8Array(100)]).size === 100;
    } catch (e) {
        return false;
    }
})();

var hasToBlobSupport = typeof HTMLCanvasElement !== "undefined" ? HTMLCanvasElement.prototype.toBlob : false;

var hasBlobSupport = hasToBlobSupport || typeof Uint8Array !== 'undefined' && typeof ArrayBuffer !== 'undefined' && typeof atob !== 'undefined';

var hasReaderSupport = typeof FileReader !== 'undefined' || typeof URL !== 'undefined';

var ImageTools = (function () {
    function ImageTools() {
        _classCallCheck(this, ImageTools);
    }

    _createClass(ImageTools, null, [{
        key: 'resize',
        value: function resize(file, maxDimensions, callback) {
            if (typeof maxDimensions === 'function') {
                callback = maxDimensions;
                maxDimensions = {
                    width: 640,
                    height: 480
                };
            }

            var maxWidth = maxDimensions.width;
            var maxHeight = maxDimensions.height;

            if (!ImageTools.isSupported() || !file.type.match(/image.*/)) {
                callback(file, false);
                return false;
            }

            if (file.type.match(/image\/gif/)) {
                // Not attempting, could be an animated gif
                callback(file, false);
                // TODO: use https://github.com/antimatter15/whammy to convert gif to webm
                return false;
            }

            var image = document.createElement('img');

            image.onload = function (imgEvt) {
                var width = image.width;
                var height = image.height;
                var isTooLarge = false;

                if (width > height && width > maxDimensions.width) {
                    // width is the largest dimension, and it's too big.
                    height *= maxDimensions.width / width;
                    width = maxDimensions.width;
                    isTooLarge = true;
                } else if (height > maxDimensions.height) {
                    // either width wasn't over-size or height is the largest dimension
                    // and the height is over-size
                    width *= maxDimensions.height / height;
                    height = maxDimensions.height;
                    isTooLarge = true;
                }

                if (!isTooLarge) {
                    // early exit; no need to resize
                    callback(file, false);
                    return;
                }

                var canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, width, height);

                if (hasToBlobSupport) {
                    canvas.toBlob(function (blob) {
                        callback(blob, true);
                    }, file.type);
                } else {
                    var blob = ImageTools._toBlob(canvas, file.type);
                    callback(blob, true);
                }
            };
            ImageTools._loadImage(image, file);

            return true;
        }
    }, {
        key: '_toBlob',
        value: function _toBlob(canvas, type) {
            var dataURI = canvas.toDataURL(type);
            var dataURIParts = dataURI.split(',');
            var byteString = undefined;
            if (dataURIParts[0].indexOf('base64') >= 0) {
                // Convert base64 to raw binary data held in a string:
                byteString = atob(dataURIParts[1]);
            } else {
                // Convert base64/URLEncoded data component to raw binary data:
                byteString = decodeURIComponent(dataURIParts[1]);
            }
            var arrayBuffer = new ArrayBuffer(byteString.length);
            var intArray = new Uint8Array(arrayBuffer);

            for (var i = 0; i < byteString.length; i += 1) {
                intArray[i] = byteString.charCodeAt(i);
            }

            var mimeString = dataURIParts[0].split(':')[1].split(';')[0];
            var blob = null;

            if (hasBlobConstructor) {
                blob = new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], { type: mimeString });
            } else {
                var bb = new BlobBuilder();
                bb.append(arrayBuffer);
                blob = bb.getBlob(mimeString);
            }

            return blob;
        }
    }, {
        key: '_loadImage',
        value: function _loadImage(image, file, callback) {
            if (typeof URL === 'undefined') {
                var reader = new FileReader();
                reader.onload = function (evt) {
                    image.src = evt.target.result;
                    if (callback) {
                        callback();
                    }
                };
                reader.readAsDataURL(file);
            } else {
                image.src = URL.createObjectURL(file);
                if (callback) {
                    callback();
                }
            }
        }
    }, {
        key: 'isSupported',
        value: function isSupported() {
            return typeof HTMLCanvasElement !== 'undefined' && hasBlobSupport && hasReaderSupport;
        }
    }]);

    return ImageTools;
})();

exports['default'] = ImageTools;
module.exports = exports['default'];