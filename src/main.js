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
// Simulation parameters
var timeStep = 0.01; // in s
var ticksPerSample = 20;

var concP = 200e-6; // in M
var concL = 0.0; // in M
var concPL = 0.0; // in M

// Sample system: Mg2+/EDTA 
// P = EDTA
// L = Mg2+

// System parameters
var deltaH = 15; // in kJ/mol
var Kd = 1.78e-6; // in M
var kOn = 4e3; // in 1/(M*s)
var kOff = Kd * kOn;

// Experiment parameters
var concPInitial = 200e-6; // in M
var concLSyringe = 2000e-6; // in M

// Instrument parameters
const vCell = 250e-6 // in L
const injectionFlowRate = 2e-6 / 4; // in L/s
var initialDelay = 60; // in s
var injectionSpacing = 120; // in s

var injectionCount = 19; // includes initial injection
var vInjectInitial = 0.4e-6; // in L
var vInject = 2.0e-6; // in L

// Readouts
var power = 0.0 // in unknown units

function StepSimulation(dt) {
    dP = -kOn * concP * concL + kOff * concPL;
    dL = dP;//-kOn * concP * concL + kOff * concPL;
    dPL = -kOff * concPL + kOn * concP * concL;

    concP += dP * dt;
    concL += dL * dt;
    concPL += dPL * dt;

    power = -dPL * 80; // arbitrary scaling
}

var totalVolInjected = 0.0;

// Simulates the instantaneous injection of
// v liters of syringe contents
// new conc = (total mol - overflow mol) / vCell
// X_new = (X * vCell - X * v) / vCell;
function Inject(v) {
    totalVolInjected += v;
    dilutionFactor = (vCell - v) / vCell;
    concP *= dilutionFactor;
    concL *= dilutionFactor;
    concPL *= dilutionFactor;
    concL = (concL * vCell + concLSyringe * v) / vCell;
}

function DoSimulation() {
    var time = 0;
    totalVolInjected = 0.0;
    concL = 0.0;
    concP = concPInitial;
    concPL = 0.0;

    runData = [];

    totalDuration = initialDelay + injectionCount * injectionSpacing;
    let totalDurationTicks = totalDuration / timeStep;

    let initialDelayTicks = initialDelay / timeStep;
    let injectionSpacingTicks = injectionSpacing / timeStep;

    let injectionDuration = vInjectInitial / injectionFlowRate;
    let injectionDurationTicks = injectionDuration / timeStep;

    for (var tick = 0; tick < totalDurationTicks; tick++) {

        let isAfterInitialDelay = tick - initialDelay / timeStep > 0;

        if (isAfterInitialDelay && (tick - initialDelayTicks) % injectionSpacingTicks == 0) {
            injectionDuration = vInject / injectionFlowRate;
            injectionDurationTicks = injectionDuration / timeStep;
        }

        if (isAfterInitialDelay &&
            (tick - initialDelayTicks) % injectionSpacingTicks < injectionDurationTicks) {
            Inject(injectionFlowRate * timeStep);
        }

        if (tick % ticksPerSample == 0) {
            //str += time + "\t" + power + "\t" + concP + "\t" + concL + "\t" + concPL + "\n";
            runData.push({ time, power, concP, concL, concPL });
        }

        StepSimulation(timeStep);
        time += timeStep;
    }


    //console.log("Total P: " + (concP + concPL));
    //console.log("Total L: " + (concL + concPL));

    // console.log((concP * concL) / concPL);
    console.log("Volume: " + totalVolInjected.toExponential());
}

function ChartData() {
    chartData = {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Power",
                    data: runData.map(k => ({ x: k.time, y: k.power })),
                    //showLine: true
                },
                /*
                {
                    label: "[P]",
                    data: runData.map(k => ({ x: k.time, y: k.concP })), showLine: true
                },*/

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
                    pointRadius: 0,
                    pointHitRadius: 8
                }
            },
            elements: {
                line: {
                    tension: 1,
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    ticks: {
                        stepSize: 60
                    }
                }
            },
            tooltips: false,
            animation: false,
            devicePixelRatio: 4
        }
    }

    if (chart == undefined) {
        chart = new Chart(canvas, chartData);
    } else {
        chart.data = chartData.data;
        chart.update();
    }
}

var runData;
var chartData;
var chart;
var canvas;
var slider;

function HandleSliderChange(value) {
    kOn = Math.pow(10, value);
    kOff = Kd * kOn;
    console.log(kOn);

    console.time("Sim");
    DoSimulation();
    console.timeEnd("Sim");
    console.time("Chart");
    ChartData();
    console.timeEnd("Chart");
}

addEventListener("load", () => { });
onload = () => {
    canvas = document.getElementById("canvas");
    slider = document.getElementById("myRange");

    slider.onchange = (ev) => HandleSliderChange(ev.target.value);

    DoSimulation();
    ChartData();
};