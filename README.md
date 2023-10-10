# ITC-Simulator
A simple isothermal titration calorimetry simulator. Heat is assumed only to be produced by the binding of protein and ligand.

The simulator uses numerical integration to compute the concentration of species over time. This yields both thermodynamic and kinetic data of an experiment. Output includes graphs of power vs time and heat vs molar ratio.

Quickly iterate on experimental design and investigate how different signal-to-noise ratios affect the error in parameters after fitting the data.

### Simulation parameters
- Set timestep and data sample rate
- Even with a precise timestep and high data sample rate, the simulation evaluates an entire run in under 5 s on modern hardware
- Use more relaxed settings to achieve realtime evaluation while modifying parameters

### System parameters
- Set K<sub>d</sub> and ΔH of the reaction
- Set k<sub>on</sub> and k<sub>off</sub>
- Interrogating kinetics of the system allows determining injection spacing to ensure equilibrium is reached

### Experiment parameters
- Set cell and syringe species concentrations
- Set initial delay before starting injections
- Set injection volume, count, and spacing

### Analysis parameters
- Coming soon
- Planned: curve fitting to a simple one site binding model along with error