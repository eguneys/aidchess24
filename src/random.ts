/* https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript */
const make_random = (seed = 1) => {
  return () => {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }
}

type RNG = () => number

export const random = make_random()

export function rnd_h(rng: RNG = random) {
  return rng() * 2 - 1
}

export function rnd_int_h(max: number, rng: RNG = random) {
  return rnd_h(rng) * max
}

export function rnd_int(max: number, rng: RNG = random) {
  return Math.floor(rng() * max)
}

export function arr_rnd<A>(arr: Array<A>) {
  return arr[rnd_int(arr.length)]
}

export function arr_remove<A>(arr: Array<A>, a: A) {
  arr.splice(arr.indexOf(a), 1)
}