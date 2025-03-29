---
theme: apple-basic
title: Welcome to Slidev
info: |
  ## Slidev Image Representation Presentation
class: text-center
transition: slide-left
# enable MDC Syntax: https://sli.dev/features/mdc
mdc: true
layout: quote
---

# Image Representations

<!--
The last comment block of each slide will be treated as slide notes. It will be visible and editable in Presenter Mode along with the slide. [Read more in the docs](https://sli.dev/guide/syntax.html#notes)
-->

---

<TitleEmbedding />

---
layout: quote
---
# An Image Representation Encodes An Image into a Numeric Format


<!-- <br> -->
<!-- <br> -->
<!-- <br> -->
<!-- <div grid="~ cols-3 gap-3" m="t-2"> -->
<!--   <div text-center> -->
<!--     &bull; Numeric Format -->
<!--     <img border="rounded" src="https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/01.png?raw=true" alt=""> -->
<!--   </div> -->
<!--   <div text-center> -->
<!--     &bull; Information Dense -->
<!--     <img border="rounded" src="https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/01.png?raw=true" alt=""> -->
<!--   </div> -->
<!--   <div text-center> -->
<!--     &bull; Useful for Tasks -->
<!--     <img border="rounded" src="https://github.com/slidevjs/themes/blob/main/screenshots/theme-default/01.png?raw=true" alt=""> -->
<!--   </div> -->
<!-- </div> -->


---
layout: two-cols
layoutClass: gap-16
---

# Numeric Format

- A neural net can only consume data in vector format.

- How do we best represent an 2d image of pixels?

- How do we preserve spatial information?

::right::

<img border="rounded" src="/numeric-format.svg" alt="">

---
layout: two-cols
layoutClass: gap-16
---

# Embeddings

- Vector representation => placing into an _embedding space_.
- Each position in the vector represents a _dimension_ in the space.

::right::

<img border="rounded" src="/embedding-space.svg" alt="">

---
---

# Lots of different embedding spaces

- CLIP
- DINO
- SigLIP
- SigLIP2
- iBOT
- LoCAP
- TIPS
- ...
- <span v-mark.underline.red><v-click>_Which one to choose?_</v-click></span>

---
layout: quote
---

# Different Image Representations are Trained to have Different <span v-mark.circle.red>Properties</span>

---
layout: two-cols-header
layoutClass: gap-16
---

# Nice things to have:

::left::

![](/prop-complexity.svg){id="complexity"}

::right::
<p text="green">Information Dense</p>
<p text="lime">Similar images are close together</p>
<p text="yellow">Images are close to relevant text</p>
<p text="orange">Representations are localized</p>
<p text="red">Representations are spatially aware</p>

<style>
#complexity {
  height: 200px;
  padding-left: 350px
}
</style>


---
layout: two-cols
layoutClass: gap-16
---

# Information Dense

- Encode only the most important information
- Discard noise

- <span v-mark.underline.orange>_noisy images should map to the same representation_</span>

::right::

<img border="rounded" src="/information-dense.svg" alt="">

---
layout: two-cols-header
layoutClass: gap-16
---

# Latent Similarity

::left::

<div v-mark.box.red=1>
  <p text="green">Information Dense</p>
  <p text="lime">Similar images are close together</p>
  <p text="yellow">Images are close to relevant text</p>
</div>
<p text="orange">Representations are localized</p>
<p text="red">Representations are spatially aware</p>

::right::
<p v-click=1>CLIP!</p>


---
layout: two-cols
layoutClass: gap-16
---

# Latent Similarity

## CLIP

- Images and text are embedded in the same embedding space.
- Embedding space where image embeddings are _close_ to embeddings of text captions describing them.
- Image model needs to learn relevant + descriptive image features.
- Dense: Irrelevant details don't change caption, so don't change embedding.

::right::
![](/clip-embedding.svg){id="clip"}

<style>
#clip {
  height: 450px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-1.svg)

<style>
img {
  height: 400px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-2.svg)

<style>
img {
  height: 400px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-3.svg)

<style>
img {
  height: 407.5px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-4.svg)

<style>
img {
  height: 407.5px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-5.svg)

<style>
img {
  height: 407.5px
}
</style>

---
transition: fade
---

# CLIP Training

![clip](/clip-train-6.svg)

<style>
img {
  height: 407.5px
}
</style>
---
---

# CLIP Training

<CLIPTraining />


---
---

# CLIP Downsides

- What image features are represented in the embedding?
- Are embeddings dense / localized?
- Are embeddings spatially aware?
- How does changing the text style/content change in the text embedding?
<br>
<span v-mark.underline.red><span v-click=1>_What changes map to the same caption/embedding?_</span></span>

---
layout: two-cols-header
layoutClass: gap-16
---

# Dense Representation

::left::

<p text="green">Information Dense</p>
<p text="lime">Similar images are close together</p>
<p text="yellow">Images are close to relevant text</p>
<p text="orange">Representations are localized</p>
<div v-mark.box.red=1>
<p text="red">Representations are spatially aware</p>
</div>

::right::
<br> <br> <br> <br>
<p v-click=1>DINO!</p>

---

# DINO

- CLIP embeddings encode high level details about an image, i.e., the things captured by a caption
- But things related to the actual visual elements of the image may be lost
- E.G., what if we wanted to perform image inpainting, or produce a depth map, or compare fine grained details of images?
- Or do pixel level semantic segmentation? CLIP would be good for the zero-shot classification part, but not for the segmentation part.
- We need a representation that learns these kind of dense, spatially aware features, i.e., is aware of the stucture of images
- DINO uses <span v-mark.underline.orange>self-supervised learning</span> to train this understanding

---

# Learning structure

- Two key aspects
  - What can we change while maintaining the overall structure?
  - How can we learn the relationships between parts of the input?

---

# Self-Supervised Learning

- Using an image as it's own label
- An example from language: Masked language training

![](/MLM.svg)
<style>
img {
  height: 300px
}
</style>

---
layout: quote
---

# How can we do this with images?

---

# DINO(v1) + BYOL

- _What can we change while maintaining the overall structure?_
- Key idea: Apply augmentation that maintains the overall image, and train the model to produce the same representation.
- _Distilling_ the core structure that is maintained into the model


---
layout: center
---

# DINO(v1) + BYOL

![](/DINO-1.svg)

<style>
img {
  height: 400px
}
</style>


---

# DINOv1 + BYOL

<DINO1Training />

---

# DINOv2 + iBOT

- DINOv2 distills the invariant parts of image structure into the model, but doesn't learn the relationships between parts of the input
- Masked language learning does this very well, it forces the model to learn relationships between parts of the input
- Can we do something similar for images?
- Vision transformers give us a natural way to do this, masking patch tokens.
- But what should the result be? We don't have a 'ground truth' token like we do for language


---

# DINOv2 + iBOT

- Similar to DINOv1, we can use _self-distillation_
- The output token for the masked area should be similar to the output token if the area was not masked
- i.e., the model should learn to be able to inpaint the masked area from surrounding visual ques, learning structure
- We can use the same student teacher model as before

---

# DINOv2 + iBOT

![](/DINOv2.svg)

---

# SILC = DINOv2 + CLIP 

- A downside to a dense representation like DINO is that it doesn't have text understanding like clip.
- Features represent image structure, but not information like a class label.
- Can we combine the two?
- SILC essentially just combines the two losses to get the best of both!
- TIPS does the same, with the addition of synthetic captions which have more details.

---

# TIPS

![](/x2.png)
<style>
img {
  height: 400px
}
</style>

---

# LocCa
- TIPS creates dense, spatially aware representations, matched with language understanding.
- But, it's representations may not be _localized_, e.g., the representation of a region may not describe the content of that region.
- Or, vice-versa, given a describtion can the representation tell us where in the image the described object is?
- How do we represent info about specific locations in an image? What if we want to represent features of patches or even pixels?
- Location-aware captioning is a training method designed to encode this information into the representation.

---
layout: two-cols-header
layoutClass: gap-16
---

# Localization

::left::

<p text="green">Information Dense</p>
<p text="lime">Similar images are close together</p>
<p text="yellow">Images are close to relevant text</p>

<div v-mark.box.red=1>
<p text="orange">Representations are localized</p>

</div>
<p text="red">Representations are spatially aware</p>

::right::
<br> <br> <br> <br>
<p v-click=1>LocCa!</p>

---

# LocCa

- The essential idea is kind of 'question answering' based.
- Three kinds of questions:
  - Caption: Predict the caption of the image (global)
  - Reference: Predict the caption of a local region, and the bounding box of that region
  - Grounded: Predict a bounding box, then the caption for that box
- The auto-regressive behaviour of the prediction gives these different characteristics
- Trained on images with regions of interest labelled (using a OWL-CLIP model) with captions.
  - Images with captions -> n-grams of caption -> Regions where n-gram occurs
- Essentially distilling these models into the representation.

---

# LocCa

![](/locca.svg)

<style>
img {
  height: 400px
}
</style>


---
layout: quote
---

# SigLIP2 

---
layout: quote
---

# SigLIP2 (drumroll)


---
layout: quote
---

# SigLIP2 

## CLIP + DINO+ LocCa


---
layout: two-cols-header
layoutClass: gap-16
---

# SigLIP2

::left::


<div v-mark.box.red=1>
<p text="green">Information Dense</p>
<p text="lime">Similar images are close together</p>
<p text="yellow">Images are close to relevant text</p>
<p text="orange">Representations are localized</p>
<p text="red">Representations are spatially aware</p>
</div>

::right::
<p v-click=1>SigLIP2!</p>

---

# SigLIP2

- All losses combined, in a nice training recipe
- Dense, spatially aware, localized, and text aware representations
- Multilingual
- Non-fixed aspect ratio

---

# SigLIP2

- Multilingual: WebLI dataset + multilingual Gemma3 tokenizer
- Staged training
    - First CLIP and LocCa
    - Then TIPS loss at 80% of the way through training
- CLIP loss is actually SigLIP loss
  - Very slightly different, Softmax => sigmoid
  - But this actually has quite large implications
  - Softmax can be interpreted as 'contrastive learning' approach across the whole batch
  - Wheras sigmoid is more like per example binary classification as match or no match

---

# SigLIP2
- Non-fixed aspect ratio
    - Normally, images are resized to a fixed size
        - Because Training is done in batches, so examples need to be a consistent size so we either need to pad or resize
    - Also usually use a fixed patch size
- SigLIP2 introduces NaFlex which unfixes both of these

---

# SigLIP2 Non-fixed aspect ratio

- Combination of:
  - NaVIT enables non-fixed aspect ratio.
    - To make each example the same size, we pack multiple images into each sequence to minimize padding
    - Masking inside the model to maintain separation between images
  - FlexVIT enables non-fixed patch size
    - During training patch size is randomly sampled, so learned weights work for a set of patch sizes
- Instead of packing though, NaFlex resizes dynamically to a patch size that meets the sequence length goal
  - At inference time, we can dynamically resize the image to get a close to native resolution representation

---

# SigLIP2 Distillation
- Finally, a method for distilling small variants is proposed, based on ACID and ACED.
    - Essentially, we want to _cheaply_ distill the large version into a smaller one by using it as a teacher
    - Normally, you'd train the student to match the logits, or activations of the teacher
    - Found that a cheaper way is to just use the teacher to curate data for the student, to make it more like the teacher
        - essentially, pick things that are hard for the student but easy for the teacher


---
layout: quote
---

# What else is there?


---

# What else is there?

- Do these properties describe everything we want in an image representation?
- Are these properties trained generally enough to work for all inputs?

---

# Graphics

- Does masking _really_ work for graphics?
- Do captions _really_ describe graphic semantics?
- Do image augmentations _really_ capture graphic invariants?
<v-click>
<ul>
<li>
  Mask entire lines? Mask sub-elements? Ensure masks intersect lines?
</li>
<li>
  Captions describing semantics, 4/5 rather than 'rating'. Caption sub-elements directly.
</li>
<li>
  Augment: Background color, Checkerbox background, line width, line style, color texture
</li>
</ul>
</v-click>

---

# Designs

- Does masking _really_ work for designs?
- Do captions _really_ describe designs?
- Do image augmentations _really_ capture design invariants?
<v-click>
<ul>
<li>
  Mask sub-elements? Ensure masks don't just intersect solid color?
</li>
<li>
  Captions describing semantics and _aesthetic styles_. Caption sub-elements directly. Inject image descriptions, text ocr
</li>
<li>
  Augment: Background color, Checkerbox background, line width, line style, color texture
</li>
</ul>
</v-click>
