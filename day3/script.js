let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// Returns notes whose text contains word, ignoring upper/lower case.
function searchNotes(word) {
  const searchWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(searchWord));
}

// Returns the note with the most characters, or null when there are no notes.
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  return notes.reduce((longest, note) =>
    note.text.length > longest.text.length ? note : longest
  );
}

// Returns an object containing the number of notes in each category.
function countByCategory() {
  const counts = {};

  for (const note of notes) {
    if (counts[note.category] === undefined) {
      counts[note.category] = 0;
    }
    counts[note.category]++;
  }

  return counts;
}

// Returns a summary sentence showing the total and category counts.
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// Returns true when a note with the same text already exists,
// ignoring case and extra spaces.
function isDuplicate(text) {
  const normalizedText = text.trim().toLowerCase().replace(/\s+/g, " ");

  return notes.some(note => {
    const normalizedNote = note.text.trim().toLowerCase().replace(/\s+/g, " ");
    return normalizedNote === normalizedText;
  });
}

// Adds a valid, non-duplicate note and returns true.
// Returns false and logs the reason when validation fails.
function addNote(text, category) {
  const trimmedText = text.trim();
  const validCategories = ["personal", "work", "study"];

  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Note not added: text must be 1–200 characters.");
    return false;
  }

  if (isDuplicate(trimmedText)) {
    console.log("Note not added: duplicate text.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("Note not added: category must be personal, work or study.");
    return false;
  }

  const nextId = notes.length === 0
    ? 1
    : Math.max(...notes.map(note => note.id)) + 1;

  notes.push({
    id: nextId,
    text: trimmedText,
    category: category
  });

  console.log("Note added successfully.");
  return true;
}

// =====================
// Function tests
// =====================

// searchNotes
console.log(searchNotes("DAY 3")); // Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]
console.log(searchNotes("xyz")); // Expected: []

// longestNote
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

// Edge case: temporarily test an empty notes array.
const savedNotes = notes;
notes = [];
console.log(longestNote()); // Expected: null
notes = savedNotes;

// countByCategory
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }
console.log(countByCategory().work); // Expected: 1

// getSummary
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."

// Edge case: exactly one note should use singular "note".
const summaryTestNotes = notes;
notes = [{ id: 99, text: "One test note", category: "personal" }];
console.log(getSummary()); // Expected: "1 note: 1 personal, 0 work, 0 study."
notes = summaryTestNotes;

// isDuplicate
console.log(isDuplicate("  buy   milk AND bread  ")); // Expected: true
console.log(isDuplicate("A completely new note")); // Expected: false

// addNote
console.log(addNote("Prepare slides for the presentation", "work")); // Expected: true
console.log(addNote("  BUY   MILK AND BREAD ", "personal")); // Expected: false
console.log(addNote("A valid note", "invalid")); // Expected: false
console.log(addNote("", "study")); // Expected: false
