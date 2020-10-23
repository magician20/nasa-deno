import { join } from "https://deno.land/std/path/mod.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { parse } from "https://deno.land/std/encoding/csv.ts";
import {pick} from "https://deno.land/x/lodash@4.17.15-es/lodash.js";
import * as log from "https://deno.land/std/log/mod.ts";

type Planet = Record<string, string>;

let planets: Array<Planet>;

export function filterHabitablePlanets(planets :Array<Planet>) : Array<Planet>{
  return planets.filter((planet) => {   
    const planetaryRadius : Number = Number(planet["koi_prad"]);
    const stellarRadius = Number(planet["koi_srad"]);
    const stellarMass = Number(planet["koi_smass"]);
    
    return planet["koi_disposition"] === "CONFIRMED" &&
      planetaryRadius > 0.5 && planetaryRadius < 1.5 &&
      stellarRadius > 0.99 && stellarRadius < 1.01 &&
      stellarMass > 0.78 && stellarMass < 1.04;
  });
}

async function loadPlanetData(): Promise<Array<Planet>> {
  const path = join("data", "kepler_exoplanets_nasa.csv");
  const file = await Deno.open(path);
  const bufReader = new BufReader(file);
  const result = await parse(bufReader, { skipFirstRow: true, comment: "#" });

  Deno.close(file.rid); 
  
  const planets=filterHabitablePlanets(result as Array<Planet> );

  return planets.map((planet) => {
    return pick(planet, [
      "kepler_name",
      "koi_prad",
      "koi_smass",
      "koi_srad",
      "koi_count",
      "koi_steff",
    ]);
  });
}

planets = await loadPlanetData();
log.info(`${planets.length} habitable planets found!`);

export function getAllPlanets() {
  return planets;
}
