const fs = require('fs');

let content = fs.readFileSync('app/flashcards/page.tsx', 'utf8');

const target1 = `    const [error, setError] = useState<string | null>(null);`;
const replacement1 = `    const [error, setError] = useState<string | null>(null);\n    const [isSaving, setIsSaving] = useState(false);`;
content = content.replace(target1, replacement1);

const target2 = `        }, 300); // Wait for flip animation to finish\n    };`;
const replacement2 = `        }, 300); // Wait for flip animation to finish\n    };\n\n    const saveDeck = async () => {\n        const title = prompt("Enter a title for this deck:");\n        if (!title) return;\n        \n        setIsSaving(true);\n        try {\n            const supabase = createClient();\n            const { data: { user } } = await supabase.auth.getUser();\n            if (!user) throw new Error("Not authenticated");\n\n            const { data: deck, error: deckError } = await supabase\n                .from('flashcards')\n                .insert({ \n                    user_id: user.id, \n                    title, \n                    resource_id: selectedResource || null,\n                    subject: 'General' \n                })\n                .select().single();\n            \n            if (deckError) throw deckError;\n\n            const itemsToInsert = flashcards.map(card => ({\n                deck_id: deck.id,\n                front_content: card.front,\n                back_content: card.back,\n                status: 'new',\n                next_review_at: new Date().toISOString()\n            }));\n\n            const { error: itemsError } = await supabase\n                .from('flashcard_items')\n                .insert(itemsToInsert);\n\n            if (itemsError) throw itemsError;\n\n            alert("Deck saved successfully!");\n            setFlashcards([]);\n        } catch(err) {\n            alert("Error saving deck: " + err.message);\n        } finally {\n            setIsSaving(false);\n        }\n    };`;
content = content.replace(target2, replacement2);

const target3 = `                                            Shuffle & Drill\n                                        </button>\n                                    </div>`;
const replacement3 = `                                            Shuffle & Drill\n                                        </button>\n                                        <button onClick={saveDeck} disabled={isSaving} className="bg-slate-100 hover:bg-slate-200 dark:bg-[#2d2d3f] text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined">save</span>{isSaving ? 'Saving' : 'Save Deck'}</button>\n                                    </div>`;
content = content.replace(target3, replacement3);

fs.writeFileSync('app/flashcards/page.tsx', content);
