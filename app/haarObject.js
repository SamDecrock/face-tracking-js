$(window).load(function() {
            "use strict";

            // lets do some fun
            var video = document.getElementById('webcam');
            var canvas = document.getElementById('canvas');
            try {
                compatibility.getUserMedia({video: true}, function(stream) {
                    try {
                        video.src = compatibility.URL.createObjectURL(stream);
                    } catch (error) {
                        video.src = stream;
                    }
                    video.addEventListener('canplay', function() {
                        video.removeEventListener('canplay');
                        setTimeout(function() {
                            video.play();
                            demo_app();
                        
                            compatibility.requestAnimationFrame(tick);
                        }, 500);
                    }, true);
                }, function (error) {
                    $('#canvas').hide();
                    $('#log').hide();
                    $('#no_rtc').html('<h4>WebRTC not available.</h4>');
                    $('#no_rtc').show();
                });
            } catch (error) {
                $('#canvas').hide();
                $('#log').hide();
                $('#no_rtc').html('<h4>Something goes wrong...</h4>');
                $('#no_rtc').show();
            }

            var stat = new profiler();

            var gui,options,ctx,canvasWidth,canvasHeight;
            var img_u8,work_canvas,work_ctx,ii_sum,ii_sqsum,ii_tilted,edg,ii_canny;
            var classifier = jsfeat.haar.frontalface;

            var max_work_size = 160;

            var demo_opt = function(){
                this.min_scale = 2;
                this.scale_factor = 1.15;
                this.use_canny = false;
                this.edges_density = 0.13;
                this.equalize_histogram = true;
            }

            function demo_app() {
                canvasWidth  = canvas.width;
                canvasHeight = canvas.height;
                ctx = canvas.getContext('2d');

                ctx.fillStyle = "rgb(0,255,0)";
                ctx.strokeStyle = "rgb(0,255,0)";

                var scale = Math.min(max_work_size/video.videoWidth, max_work_size/video.videoHeight);
                var w = (video.videoWidth*scale)|0;
                var h = (video.videoHeight*scale)|0;

                img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
                edg = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
                work_canvas = document.createElement('canvas');
                work_canvas.width = w;
                work_canvas.height = h;
                work_ctx = work_canvas.getContext('2d');
                ii_sum = new Int32Array((w+1)*(h+1));
                ii_sqsum = new Int32Array((w+1)*(h+1));
                ii_tilted = new Int32Array((w+1)*(h+1));
                ii_canny = new Int32Array((w+1)*(h+1));

                options = new demo_opt();
                gui = new dat.GUI();

                gui.add(options, 'min_scale', 1, 4).step(0.1);
                gui.add(options, 'scale_factor', 1.1, 2).step(0.025);
                gui.add(options, 'equalize_histogram');
                gui.add(options, 'use_canny');
                gui.add(options, 'edges_density', 0.01, 1.).step(0.005);

                stat.add("haar detector");
            }

            function tick() {
                compatibility.requestAnimationFrame(tick);
                stat.new_frame();
                if (video.readyState === video.HAVE_ENOUGH_DATA) {

                    ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

                    work_ctx.drawImage(video, 0, 0, work_canvas.width, work_canvas.height);
                    var imageData = work_ctx.getImageData(0, 0, work_canvas.width, work_canvas.height);

                    stat.start("haar detector");
                    
                    jsfeat.imgproc.grayscale(imageData.data, img_u8.data);

                    // possible options
                    if(options.equalize_histogram) {
                        jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
                    }
                    //jsfeat.imgproc.gaussian_blur(img_u8, img_u8, 3);

                    jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, classifier.tilted ? ii_tilted : null);

                    if(options.use_canny) {
                        jsfeat.imgproc.canny(img_u8, edg, 10, 50);
                        jsfeat.imgproc.compute_integral_image(edg, ii_canny, null, null);
                    }

                    jsfeat.haar.edges_density = options.edges_density;
                    var rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted, options.use_canny? ii_canny : null, img_u8.cols, img_u8.rows, classifier, options.scale_factor, options.min_scale);
                    rects = jsfeat.haar.group_rectangles(rects, 1);

                    stat.stop("haar detector");

                    // draw only most confident one
                    draw_faces(ctx, rects, canvasWidth/img_u8.cols, 1);

                    $('#log').html(stat.log());
                }
            }

            function draw_faces(ctx, rects, sc, max) {
                var on = rects.length;
                if(on && max) {
                    jsfeat.math.qsort(rects, 0, on-1, function(a,b){return (b.confidence<a.confidence);})
                }
                var n = max || on;
                n = Math.min(n, on);
                var r;
                for(var i = 0; i < n; ++i) {
                    r = rects[i];
                    ctx.strokeRect((r.x*sc)|0,(r.y*sc)|0,(r.width*sc)|0,(r.height*sc)|0);
                }
            }

            $(window).unload(function() {
                video.pause();
                video.src=null;
            });
        });