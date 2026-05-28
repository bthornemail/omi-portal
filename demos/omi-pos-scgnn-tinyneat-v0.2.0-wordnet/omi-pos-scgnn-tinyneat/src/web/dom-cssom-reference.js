// DOM/CSSOM reference frame supplied as the stable browser object-model tetrahedron.

export const DOM_INTERFACES = Object.freeze([
  "AbortController", "AbortSignal", "AbstractRange", "Attr", "CDATASection", "CharacterData",
  "Comment", "CustomEvent", "Document", "DocumentFragment", "DocumentType", "DOMException",
  "DOMImplementation", "DOMParser", "DOMTokenList", "Element", "Event", "EventTarget",
  "HTMLCollection", "MutationObserver", "MutationRecord", "NamedNodeMap", "Node", "NodeIterator",
  "NodeList", "ProcessingInstruction", "Range", "ShadowRoot", "StaticRange", "Text",
  "TreeWalker", "XMLDocument", "XPathEvaluator", "XPathExpression", "XPathResult", "XSLTProcessor"
]);

export const CSSOM_INTERFACES = Object.freeze([
  "AnimationEvent", "CaretPosition", "CSS", "CSSConditionRule", "CSSCounterStyleRule",
  "CSSFontFaceDescriptors", "CSSFontFaceRule", "CSSFontFeatureValuesMap", "CSSFontFeatureValuesRule",
  "CSSFunctionDeclarations", "CSSFunctionDescriptors", "CSSFunctionRule", "CSSGroupingRule",
  "CSSImportRule", "CSSKeyframeRule", "CSSKeyframesRule", "CSSMarginRule", "CSSMediaRule",
  "CSSNamespaceRule", "CSSPageRule", "CSSPositionTryRule", "CSSPositionTryDescriptors", "CSSRule",
  "CSSRuleList", "CSSStartingStyleRule", "CSSStyleDeclaration", "CSSStyleSheet", "CSSStyleRule",
  "CSSSupportsRule", "CSSNestedDeclarations", "FontFace", "FontFaceSet", "FontFaceSetLoadEvent",
  "MediaList", "MediaQueryList", "MediaQueryListEvent", "Screen", "StyleSheet", "StyleSheetList",
  "TransitionEvent", "VisualViewport"
]);

export const CSS_TYPED_OM_INTERFACES = Object.freeze([
  "CSSImageValue", "CSSKeywordValue", "CSSMathClamp", "CSSMathInvert", "CSSMathMax", "CSSMathMin",
  "CSSMathNegate", "CSSMathProduct", "CSSMathSum", "CSSMathValue", "CSSMatrixComponent",
  "CSSNumericArray", "CSSNumericValue", "CSSPerspective", "CSSPositionValue", "CSSRotate",
  "CSSScale", "CSSSkew", "CSSSkewX", "CSSSkewY", "CSSStyleValue", "CSSTransformComponent",
  "CSSTransformValue", "CSSTranslate", "CSSUnitValue", "CSSUnparsedValue", "CSSVariableReferenceValue",
  "StylePropertyMap", "StylePropertyMapReadOnly"
]);

export const CSSOM_EXTENDED_INTERFACES = Object.freeze([
  "Document", "Window", "Element", "HTMLElement", "HTMLImageElement", "Range", "MouseEvent", "SVGElement"
]);

export const DOM_CSSOM_VERTEX_SETS = Object.freeze({
  FS: { label: "DOM", nodeType: "file", terms: DOM_INTERFACES },
  GS: { label: "CSSOM", nodeType: "group", terms: CSSOM_INTERFACES },
  RS: { label: "CSSTypedOM", nodeType: "link", terms: CSS_TYPED_OM_INTERFACES },
  US: { label: "SharedExtended", nodeType: "text", terms: CSSOM_EXTENDED_INTERFACES }
});
