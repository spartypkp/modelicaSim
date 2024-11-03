#!/usr/bin/env python3
# from scipy.io import loadmat
from OMPython import ModelicaSystem  # , OMCSessionZMQ
import tempfile
from pandas import DataFrame, Series
from dataScience import load_json
import numpy as np


def sim(model: str, df: DataFrame):
    sim = DataFrame()
    dt = df["timestamp"].diff().mean().microseconds / 1e6
    with tempfile.NamedTemporaryFile(suffix=".mo") as f:
        f.write(str.encode(model))
        f.flush()
        s = ModelicaSystem(f.name, "Sys")
        s.buildModel()
        s.setSimulationOptions(
            [
                f"stepSize={dt}",
            ]
        )
        s.simulate()
    ks = [k for k in list(df.keys()) if k != "timestamp"]
    vs = s.getSolutions(ks)
    for i in range(0, len(ks)):
        v = np.array(vs[i])
        d = Series(v, np.arange(0, len(v) * dt, dt))
        sim[ks[i]] = d
    sim["timestamp"] = np.arange(0, len(vs[0]) * dt, dt)
    print(sim.keys())
    return False, sim


if __name__ == "__main__":
    _, _, df = load_json("data/2/box-dt.json")
    sim(
        """
model Sys
  // Parameters
  parameter Real k_heating = 0.5 "Heating rate coefficient";
  parameter Real k_cooling = 0.003 "Cooling rate coefficient";
  parameter Real T_ambient = 27.3 "Ambient temperature (average of x1)";
  parameter Real T_initial = 22.6 "Initial temperature";

  // Variables
  Real x0(start=T_initial) "Primary temperature measurement";
  Real x1(start=T_ambient) "Reference/ambient temperature measurement";

  // Control input
  Boolean heater_on;

initial equation
  heater_on = false;

equation
  // x1 is maintained near ambient with small variations
  x1 = T_ambient + 0.2*sin(time/100);

  // Differential equation for x0
  der(x0) = if heater_on then
              k_heating*(66.0 - x0) // Heating phase
            else
              -k_cooling*(x0 - T_ambient); // Cooling phase

  // Heater control logic based on time
  heater_on = time >= 200 and time < 300; // Adjust these times as needed

end Sys;
    """,
        df,
    )
