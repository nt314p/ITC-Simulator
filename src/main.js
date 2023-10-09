console.log("Hello world!");

/* 
Assumptions:

Heat is only released or absorbed by the binding of protein and ligand.
Heat of dilution, PV work performed by injection, friction, etc. are not
considered.

The protein and ligand are diluted as the experiment proceeds due to
injections of ligand.

Injecting a volume v of ligand into the cell causes the displacement of
an equal volume v of solution out of the cell. The ejected solution does
not account for ligand mixing; it consists of the cell solution
instantaneously before the injection takes place.

*/

// Sample system: Mg2+/EDTA 
// P = EDTA
// L = Mg2+
deltaH = 15; // in kJ/mol
Kd = 1.78e-6; // in M

concP = 300e-6; // in M
concLSyringe = 800e-6; // in M
concL = 0.0; // in M
concPL = 0.0; // in M

vCell = 250e-6 // in L

kOn = 1e6; // in 1/(M*s)
kOff = Kd * kOn;

power = 0.0 // in unknown units

function StepSimulation(dt) {
    dP = -kOn * concP * concL + kOff * concPL;
    dL = dP;//-kOn * concP * concL + kOff * concPL;
    dPL = -kOff * concPL + kOn * concP * concL;

    concP += dP * dt;
    concL += dL * dt;
    concPL += dPL * dt;

    power = -dPL * 0.5; // arbitrary scaling
}

var runData;
var chartData;

addEventListener("load", (event) => { });
onload = (event) => {
    document.getElementById("status").innerHTML = "Simulating...";

    var output = document.getElementById("output");
    var time = 0;

    var str = "";

    runData = [];

    for (var i = 0; i < 120000; i++) {
        if (i % 5000 < 400 && time < 9.9) {
            concL += concLSyringe / (20 * 400);
        }

        if (i % 50 == 0) {
            str += time + "\t" + power + "\t" + concP + "\t" + concL + "\t" + concPL + "\n";
            runData.push({ time, power, concP, concL, concPL });
        }

        StepSimulation(0.0001);
        time += 0.0001;
    }

    output.innerHTML = str;

    console.log("Total P: " + (concP + concPL));
    console.log("Total L: " + (concL + concPL));

    console.log((concP * concL) / concPL);

    document.getElementById("status").innerHTML = "Done!";

    chartData = {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Power",
                    data: runData.map(k => ({ x: k.time, y: k.power })),
                    //showLine: true
                },
                {
                    label: "[P]",
                    data: runData.map(k => ({ x: k.time, y: k.concP })), showLine: true
                },
                {
                    label: "[L]",
                    data: runData.map(k => ({ x: k.time, y: k.concL })), showLine: true
                },
                {
                    label: "[PL]",
                    data: runData.map(k => ({ x: k.time, y: k.concPL })), showLine: true
                }
            ],

        },
        options: {
            interaction: {
                mode: 'nearest',
            },
            datasets: {
                scatter: {
                    showLine: true,
                    pointRadius: 0
                }
            },
            elements: {
                line: {
                    tension: 1,
                    borderWidth: 1
                }
            },
            tooltips: false,
            animation: false,
            devicePixelRatio: 4
        }
    }

    var canvas = document.getElementById("canvas");
    new Chart(canvas,
        chartData
    )
};