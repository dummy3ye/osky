(function() {
    var logo = [
        '    .----.',
        '   /    /|',
        '  /    / |',
        " '----'  |",
        ' |    |  |',
        ' |    |  /',
        ' |    | /',
        " '----'",
    ];

    var CW = {};
    CW['M'] = 1.00; CW['N'] = 0.88; CW['m'] = 0.76; CW['d'] = 0.66;
    CW['h'] = 0.56; CW['b'] = 0.56; CW['y'] = 0.46; CW['o'] = 0.38;
    CW['n'] = 0.38; CW['s'] = 0.30; CW['+'] = 0.22; CW[':'] = 0.18;
    CW['='] = 0.22; CW['-'] = 0.14; CW['`'] = 0.08; CW['.'] = 0.10;
    CW['/'] = 0.12; CW["'"] = 0.06; CW['|'] = 0.40; CW['`'] = 0.06; CW[' '] = 0.00;

    function charWeight(c) {
        if (CW[c] !== undefined) return CW[c];
        if (c >= 'A' && c <= 'Z') return 0.80;
        if (c >= 'a' && c <= 'z') return 0.50;
        return 0.15;
    }

    var rows = logo.length;
    var cols = logo[0].length;
    var depth = 0.5;

    var hmap = [];
    for (var r = 0; r < rows; r++) {
        hmap[r] = [];
        for (var c = 0; c < cols; c++) {
            hmap[r][c] = charWeight(logo[r].charAt(c));
        }
    }

    function isEdge(r, c) {
        if (r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1) return true;
        return hmap[r-1][c] < 0.01 || hmap[r+1][c] < 0.01 ||
               hmap[r][c-1] < 0.01 || hmap[r][c+1] < 0.01;
    }

    var px = [], py = [], pz = [], pnx = [], pny = [], pnz = [];

    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var w = hmap[r][c];
            if (w < 0.01) continue;

            var x = (c - cols / 2) / cols;
            var y = (r - rows / 2) / rows;
            var thick = (0.15 + w * 0.35) * depth;
            var zfront = thick;
            var zback = -thick;
            var edge = isEdge(r, c);

            var ri = Math.min(Math.max(r, 1), rows - 2);
            var ci = Math.min(Math.max(c, 1), cols - 2);
            var dhdx = (hmap[ri][ci + 1] - hmap[ri][ci - 1]) * 0.5;
            var dhdy = (hmap[ri + 1][ci] - hmap[ri - 1][ci]) * 0.5;
            var fnx = -dhdx * depth;
            var fny = dhdy * depth;
            var fnz = 0.15;
            var fl = Math.sqrt(fnx * fnx + fny * fny + fnz * fnz);
            fnx /= fl; fny /= fl; fnz /= fl;

            var enx = 0, eny = 0;
            if (edge) {
                if (c > 0 && hmap[r][c-1] < 0.01) enx -= 1;
                if (c < cols-1 && hmap[r][c+1] < 0.01) enx += 1;
                if (r > 0 && hmap[r-1][c] < 0.01) eny -= 1;
                if (r < rows-1 && hmap[r+1][c] < 0.01) eny += 1;
                var el = Math.sqrt(enx * enx + eny * eny);
                if (el > 0) { enx /= el; eny /= el; }
            }

            px.push(x); py.push(y); pz.push(zfront);
            pnx.push(fnx); pny.push(fny); pnz.push(fnz);

            px.push(x); py.push(y); pz.push(zback);
            pnx.push(-fnx); pny.push(-fny); pnz.push(-fnz);

            var layers = edge ? 12 : 6;
            for (var l = 1; l < layers; l++) {
                var t = l / layers;
                px.push(x); py.push(y); pz.push(zfront + (zback - zfront) * t);
                if (edge) {
                    pnx.push(enx); pny.push(eny); pnz.push(0);
                } else {
                    pnx.push(fnx * (1 - 2 * t));
                    pny.push(fny * (1 - 2 * t));
                    pnz.push(fnz * (1 - 2 * t));
                }
            }
        }
    }

    var npoints = px.length;
    var canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    var ctx = canvas.getContext('2d');
    var link = document.querySelector('link[rel="icon"]');
    var angleA = 0;
    var angleB = 0;

    var lx = 0.2, ly = -0.1, lz = 1;
    var ll = Math.sqrt(lx*lx+ly*ly+lz*lz);
    lx /= ll; ly /= ll; lz /= ll;

    var hvx = lx, hvy = ly, hvz = lz + 1;
    var hvl = Math.sqrt(hvx*hvx+hvy*hvy+hvz*hvz);
    hvx /= hvl; hvy /= hvl; hvz /= hvl;

    var rC = 102, gC = 217, bC = 200;

    function draw() {
        var cosA = Math.cos(angleA), sinA = Math.sin(angleA);
        var cosB = Math.cos(angleB), sinB = Math.sin(angleB);

        var zbuf = new Float32Array(32 * 32);
        var imgData = ctx.createImageData(32, 32);
        var data = imgData.data;

        for (var i = 0; i < zbuf.length; i++) zbuf[i] = -1e9;

        for (var i = 0; i < npoints; i++) {
            var x1 = px[i] * cosB + pz[i] * sinB;
            var z1 = -px[i] * sinB + pz[i] * cosB;
            var y1 = py[i] * cosA - z1 * sinA;
            var z2 = py[i] * sinA + z1 * cosA;

            var rnx = pnx[i] * cosB + pnz[i] * sinB;
            var rnz1 = -pnx[i] * sinB + pnz[i] * cosB;
            var rny = pny[i] * cosA - rnz1 * sinA;
            var rnz = pny[i] * sinA + rnz1 * cosA;

            var d = z2 + 1.6;
            if (d < 0.1) continue;
            var inv = 1.0 / d;
            var sx = (16 + x1 * 28 * inv) | 0;
            var sy = (16 + y1 * 40 * inv) | 0;

            if (sx < 0 || sx >= 32 || sy < 0 || sy >= 32) continue;

            var idx = sy * 32 + sx;

            if (inv > zbuf[idx]) {
                zbuf[idx] = inv;

                var rl = Math.sqrt(rnx * rnx + rny * rny + rnz * rnz);
                if (rl > 0.001) { rnx /= rl; rny /= rl; rnz /= rl; }

                var diff = Math.abs(rnx * lx + rny * ly + rnz * lz);

                var spec = Math.abs(rnx * hvx + rny * hvy + rnz * hvz);
                spec = spec * spec;
                spec = spec * spec;
                spec = spec * spec;

                var L = 1.0 + 6.0 * diff + 3.0 * spec;
                if (L > 1) L = 1;

                var pi = idx * 4;
                data[pi] = (rC * L) | 0;
                data[pi + 1] = (gC * L) | 0;
                data[pi + 2] = (bC * L) | 0;
                data[pi + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        angleA += 0.012;
        angleB += 0.03;

        link.href = canvas.toDataURL('image/png');
        requestAnimationFrame(draw);
    }

    draw();
})();