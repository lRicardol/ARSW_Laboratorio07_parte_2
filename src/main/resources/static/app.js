var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#007bff";
        ctx.fill();
        ctx.stroke();
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        // Conectarse al broker y suscribirse al tópico
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            // Suscribirse al tópico correcto
            stompClient.subscribe('/topic/newpoint', function (eventBody) {
                var point = JSON.parse(eventBody.body);
                alert("Nuevo punto recibido: X=" + point.x + " Y=" + point.y);
                addPointToCanvas(point);
            });
        });
    };

    return {

        init: function () {
            console.info("Initializing application...");
            connectAndSubscribe(); // Conectar al cargar
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            console.info("Publishing point at (" + pt.x + "," + pt.y + ")");
            addPointToCanvas(pt);

            if (stompClient) {
                stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            } else {
                console.error("STOMP client not connected.");
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();
