import type { CourseData } from '../types';

// Actual Liphook Golf Club course data with correct yardages from scorecard
export const liphookCourseData: CourseData = {
  name: "Liphook Golf Club",
  par: 70,
  teeBoxes: [
    { name: "Yellow", color: "yellow", courseRating: 69.4, slopeRating: 126 },
    { name: "White", color: "white", courseRating: 70.9, slopeRating: 129 },
    { name: "Blue", color: "blue", courseRating: 71.9, slopeRating: 134 }
  ],
  holes: [
    // Front 9
    { number: 1, name: "Birch Hill", par: 3, handicapIndex: 7, yardages: { yellow: 184, white: 203, blue: 203 } },
    { number: 2, name: "The Old Road", par: 4, handicapIndex: 3, yardages: { yellow: 411, white: 423, blue: 424 } },
    { number: 3, name: "Mitland", par: 3, handicapIndex: 13, yardages: { yellow: 117, white: 142, blue: 142 } },
    { number: 4, name: "High View", par: 4, handicapIndex: 1, yardages: { yellow: 439, white: 460, blue: 460 } },
    { number: 5, name: "The Black Fox", par: 5, handicapIndex: 17, yardages: { yellow: 469, white: 489, blue: 499 } },
    { number: 6, name: "Ripley", par: 4, handicapIndex: 5, yardages: { yellow: 396, white: 420, blue: 456 } },
    { number: 7, name: "Two Counties", par: 5, handicapIndex: 15, yardages: { yellow: 478, white: 501, blue: 501 } },
    { number: 8, name: "The Pulpit", par: 3, handicapIndex: 11, yardages: { yellow: 162, white: 169, blue: 176 } },
    { number: 9, name: "Waterside", par: 4, handicapIndex: 9, yardages: { yellow: 355, white: 363, blue: 363 } },
    // Back 9
    { number: 10, name: "Fowley", par: 4, handicapIndex: 2, yardages: { yellow: 369, white: 397, blue: 431 } },
    { number: 11, name: "Forest Mere", par: 5, handicapIndex: 6, yardages: { yellow: 511, white: 542, blue: 560 } },
    { number: 12, name: "The Bowl", par: 3, handicapIndex: 12, yardages: { yellow: 136, white: 150, blue: 150 } },
    { number: 13, name: "The Valley", par: 4, handicapIndex: 10, yardages: { yellow: 327, white: 334, blue: 381 } },
    { number: 14, name: "Bohunt", par: 4, handicapIndex: 4, yardages: { yellow: 417, white: 434, blue: 434 } },
    { number: 15, name: "Hollycombe", par: 4, handicapIndex: 16, yardages: { yellow: 301, white: 308, blue: 308 } },
    { number: 16, name: "The Quarry", par: 4, handicapIndex: 8, yardages: { yellow: 344, white: 360, blue: 360 } },
    { number: 17, name: "Sussex Edge", par: 3, handicapIndex: 14, yardages: { yellow: 148, white: 161, blue: 161 } },
    { number: 18, name: "Wheatsheaf", par: 5, handicapIndex: 18, yardages: { yellow: 449, white: 461, blue: 515 } }
  ]
};