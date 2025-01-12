import { convertFromRaw, convertToRaw, Editor, EditorState, Modifier, RichUtils } from 'draft-js';
import './App.css';
import { useEffect, useRef, useState } from 'react';


function App() {
  const [editorState, setEditorState] = useState(
    () => EditorState.createEmpty(),
  );
  const applyBlockStyle = (style, text, selection) => {
    const contentState = editorState.getCurrentContent();
    const updatedContent = Modifier.replaceText(
      contentState,
      selection.merge({
        anchorOffset: 0,
        focusOffset: text.length,
      }),
      "",
      null
    );

    const newEditorState = EditorState.push(
      editorState,
      updatedContent,
      "change-block-type"
    );
    setEditorState(RichUtils.toggleBlockType(newEditorState, style));
    return "handled";
  };
  const customStyleMap = {
    RED: {
      color: "red",
    },
    BOLD: {
      fontWeight: 'bold'
    },
    UNDERLINE: {
      textDecoration: 'underline'
    }
  };

  const applyInlineStyle = (style, text, selection) => {
    const contentState = editorState.getCurrentContent();
    const updatedContent = Modifier.replaceText(
      contentState,
      selection.merge({
        anchorOffset: 0,
        focusOffset: text.length,
      }),
      "",
      null
    );
    const newEditorState = EditorState.push(
      editorState,
      updatedContent,
      "insert-characters"
    );
    setEditorState(RichUtils.toggleInlineStyle(newEditorState, style));
    return "handled";
  };

  const handleBeforeInput = (chars) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const blockKey = selectionState.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const blockText = block.getText();

    if (blockText.startsWith("#") && chars === " ") {
      console.log("head", chars, blockText)
      return applyBlockStyle("header-one", blockText, selectionState);
    } else if (blockText.startsWith("*") && chars === " " && blockText.length === 1) {
      console.log("bold", chars, blockText)
      return applyInlineStyle("BOLD", blockText, selectionState);
    } else if (blockText.startsWith("**") && chars === " " && blockText.length === 2) {
      console.log("red", chars, blockText)
      return applyInlineStyle("RED", blockText, selectionState);
    } else if (blockText.startsWith("***") && chars === " ") {
      return applyInlineStyle("UNDERLINE", blockText, selectionState);
    }
    return false;
  };
  const handleReturn = (e) => {
    const currentBlockType = RichUtils.getCurrentBlockType(editorState);

    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();

    if (!selection.isCollapsed()) return "not-handled";

    const currentInlineStyles = editorState.getCurrentInlineStyle();
    let updatedContentState = contentState;
    currentInlineStyles.forEach((style) => {
      updatedContentState = Modifier.removeInlineStyle(
        updatedContentState,
        selection,
        style
      );
    });
    const newContentState = Modifier.splitBlock(updatedContentState, selection)
    const updatedEditorState = EditorState.push(
      editorState,
      newContentState,
      "split-block"
    )
    const resetEditorState = EditorState.forceSelection(
      updatedEditorState,
      newContentState.getSelectionAfter()
    );
    if (currentBlockType === "header-one") {
      const unstyledState = RichUtils.toggleBlockType(updatedEditorState, "unstyled");
      setEditorState(EditorState.forceSelection(unstyledState, unstyledState.getSelection()));
      return "handled";
    }
    setEditorState(resetEditorState);
    return "handled";


  };

  useEffect(() => {
    const savedContent = localStorage.getItem("draftContent");
    if (savedContent) {
      const contentState = convertFromRaw(JSON.parse(savedContent));
      setEditorState(EditorState.createWithContent(contentState));
    }
  }, []);
  const editorRef = useRef(null)
  const saveContent = () => {
    const contentState = editorState.getCurrentContent();
    const rawContent = convertToRaw(contentState);
    localStorage.setItem("draftContent", JSON.stringify(rawContent));
  };



  return (
    <div className='App'>
      <div className='App-header'>
        <div className='header'>
          <header >Draft.js Demo By Shwetkamal Gaud</header>
        </div>
        <div className='App-button'>

          <button onClick={saveContent}>
            Save
          </button>
        </div>
      </div>
      <div
        className='App-editor'
        onClick={() => editorRef.current.focus()}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={setEditorState}
          handleBeforeInput={handleBeforeInput}
          handleReturn={handleReturn}
          customStyleMap={customStyleMap}
        />
      </div>
 

    </div>
  );
}

export default App;
