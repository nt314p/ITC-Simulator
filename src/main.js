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
var timestep = 0.01; // in s
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
var concCellInitial = 200e-6; // in M
var concSyringe = 2000e-6; // in M

// Instrument parameters
const vCell = 250e-6 // in L
const injectionFlowRate = 2e-6 / 4; // in L/s
var initialDelay = 60; // in s
var injectionSpacing = 120; // in s

var injectionCount = 19; // includes initial injection
var vInjectInitial = 0.4e-6; // in L
var vInject = 2.0e-6; // in L

// Readouts
var power = 0.0; // in unknown units

function StepSimulation(dt) {
    const dP = -kOn * concP * concL + kOff * concPL;
    const deltaP = dP * dt;

    concP += deltaP;
    concL += deltaP;
    concPL -= deltaP;

    power = dP * 80; // arbitrary scaling
}

var totalVolInjected = 0.0;

// Simulates the instantaneous injection of
// v liters of syringe contents
// new conc = (total mol - overflow mol) / vCell
// X_new = (X * vCell - X * v) / vCell;
// X_new = X - X * (v / vCell)
function Inject(v) {
    totalVolInjected += v;
    dilutionFactor = v / vCell;
    concP -= concP * dilutionFactor;
    concL -= concL * dilutionFactor;
    concPL -= concPL * dilutionFactor;
    concL = (concL * vCell + concSyringe * v) / vCell;
}

var runData;

function DoSimulation() {
    console.time("Simulation");

    var time = 0;
    totalVolInjected = 0.0;
    concL = 0.0;
    concP = concCellInitial;
    concPL = 0.0;


    totalDuration = initialDelay + injectionCount * injectionSpacing;
    let totalDurationTicks = totalDuration / timestep;

    let initialDelayTicks = initialDelay / timestep;
    let injectionSpacingTicks = injectionSpacing / timestep;

    let injectionDuration = vInjectInitial / injectionFlowRate;
    let injectionDurationTicks = injectionDuration / timestep;

    runData = new Array(Math.floor(totalDurationTicks / ticksPerSample));
    console.log({ totalDurationTicks });

    var index = 0;

    for (var tick = 0; tick < totalDurationTicks; tick++) {

        let isAfterInitialDelay = tick - initialDelay / timestep > 0;

        if (isAfterInitialDelay && (tick - initialDelayTicks) % injectionSpacingTicks == 0) {
            injectionDuration = vInject / injectionFlowRate;
            injectionDurationTicks = injectionDuration / timestep;
        }

        if (isAfterInitialDelay &&
            (tick - initialDelayTicks) % injectionSpacingTicks < injectionDurationTicks) {
            Inject(injectionFlowRate * timestep);
        }

        if (tick % ticksPerSample == 0) {
            //str += time + "\t" + power + "\t" + concP + "\t" + concL + "\t" + concPL + "\n";
            runData[index] = ({ time, power, concP, concL, concPL });
            index++;
        }

        StepSimulation(timestep);
        time += timestep;
    }

    console.timeEnd("Simulation");
}

var chartData;
var chart;
var canvas;

function ChartData() {
    console.time("Graph");
    chartData = {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Power",
                    data: runData.map(k => ({ x: k.time, y: k.power })),
                },
                /*
                {
                    label: "[P]",
                    data: runData.map(k => ({ x: k.time, y: k.concP })), showLine: true
                },*/

                {
                    label: "[L]",
                    data: runData.map(k => ({ x: k.time, y: k.concL }))
                },
                {
                    label: "[PL]",
                    data: runData.map(k => ({ x: k.time, y: k.concPL }))
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
            // spanGaps: true,
            // showLine: false,
            parsing: false,
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
    console.timeEnd("Graph");
}

class Input {
    constructor(paramName, isDriver) {
        this.paramName = paramName;
        this.inputElement = document.getElementById(Input.ParamToInputName(paramName));
        this.useSIFormatting = this.inputElement.attributes.hasOwnProperty("sivalue");
        this.isDriver = isDriver;
        this.inputElement.oninput = (ev) => this.HandleRangeFormatting(ev.target.value);
        if (isDriver) {
            this.inputElement.onchange = (ev) => this.HandleRangeUpdate(ev.target.value);
        }
        this.inputElement.onblur = (ev) => this.FormatRange(ev.target.value);
        //this.internalValue = Number(inputElement.value);
    }

    FormatRange(value) {
        if (!this.useSIFormatting) return;
        var num = Number(value);
        if (this.useSIFormatting) num = num.toPrefixExponential();
        //this.internalValue = va

        console.log("the element isn't focused so im overwriting its value LOL");
        this.inputElement.value = num;
    }

    HandleRangeFormatting(value) {
        if (this.IsFocused()) return;

        this.FormatRange(value); 
    }

    HandleRangeUpdate(value) {
        this.FormatRange(value);

        // TODO: could cause problems with precision
        // number is not exactly the same with SI formatting due to fixed rounding
        window[this.paramName] = Number(value); 

        DoSimulation();
        ChartData();
    }

    IsFocused() {
        console.log(document.activeElement, this.inputElement);
        return this.inputElement == document.activeElement;
    }

    static ParamToInputName(paramName) {
        return paramName + "Input";
    }
}


function HandleKOnInput(value) {
    kOn = value;
    kOff = Kd * kOn;

    document.getElementById("kOffInput").value = kOff.toPrefixExponential();

    DoSimulation();
    ChartData();
}

// Driver parameters set the internal variables based on the input
// These parameters require no additional intervention
const driverSimParameterNames = [
    "timestep",
    "ticksPerSample",
    "concCellInitial",
    "concSyringe",
    "initialDelay",
    "injectionSpacing",
    "injectionCount",
    "vInjectInitial",
    "vInject"
];

// These parameters require functions to run when they are set
const driverSimParameterNamesSpecial = [
    "deltaH", // calculate thermodynamic params
    "Kd", // calculate thermodynamic params
    "kOn", // calculate kOff
];

// Driven parameters are used to display internal variables to the user
const drivenSimParameterNames = [
    "kOff",
];


const allSimParameterNames = driverSimParameterNames.concat(driverSimParameterNamesSpecial, drivenSimParameterNames);

function InitializeInputs() {
    allSimParameterNames.forEach(inputName => {
        var inputId = inputName + "Input"; // definitely not cursed reflection
        this[inputId] = document.getElementById(inputId);
    });

    driverSimParameterNames.forEach(inputName => {
        new Input(inputName, true);
    });
}

addEventListener("load", () => { });
onload = () => {
    canvas = document.getElementById("canvas");
    //kOnInput = document.getElementById("kOnInput");
    InitializeInputs();

    kOnInput.onchange = (ev) => HandleKOnInput(ev.target.value);

    DoSimulation();
    ChartData();
};

// Returns the number as a string formatted as
// m e 3n
// where 1 <= m < 1000 and n is an integer
Number.prototype.toPrefixExponential = function () {
    let value = this.valueOf();
    if (value < 1e-6) return (value / 1e-9).toFixed(2) + "e-9";
    if (value < 1e-3) return (value / 1e-6).toFixed(2) + "e-6";
    if (value < 1e0) return (value / 1e-3).toFixed(2) + "e-3";
    return value.toFixed(2);
}