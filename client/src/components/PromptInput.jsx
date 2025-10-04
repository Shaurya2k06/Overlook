import { useState } from "react";

const PromptInput = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(prompt.trim());
      setPrompt(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error submitting prompt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const examplePrompts = [
    "Create a hello world function",
    "Build a calculator with basic operations",
    "Create an array manipulation example",
    "Write a class for a user object",
    "Create an async function example",
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-white text-lg mb-2 font-semibold">
          AI Code Assistant
        </h3>
        <p className="text-gray-400 text-sm">
          Enter a prompt to generate or modify code
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what code you want to generate or modify..."
            className="w-full px-3 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm resize-vertical min-h-[80px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isSubmitting}
            className="w-full px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Generating..." : "Generate Code"}
          </button>
        </div>
      </form>

      <div className="mb-6">
        <h4 className="text-white text-base mb-3 font-medium">
          Example prompts:
        </h4>
        <div className="space-y-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="w-full px-3 py-2 bg-gray-800 text-gray-400 border border-gray-600 rounded text-xs text-left hover:bg-gray-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              disabled={isSubmitting}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto bg-gray-800 p-4 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-xs leading-relaxed">
          <strong className="text-white">Note:</strong> The AI will generate new
          code based on your prompt and replace the current code in the editor.
          All participants in the room will see the updated code.
        </p>
      </div>
    </div>
  );
};

export default PromptInput;
