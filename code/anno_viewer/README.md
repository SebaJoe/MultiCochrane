# anno_viewer

This is an tool for annotating sentence alignments between texts. It will allow users to annotate with the help of similarity score rankings.  

## How to Use:

The tool is self-intuitive for the most part. The following steps might need further clarification.

### Loading the Alignment File:

The alignment file needs to follow the same format as the sample file in the repo. The key detail is that this tool does not compute similarity scores. 
These are pre-computed and are a part of the alignment file. The ID system works like this:

```
For pair IDs:
ID-title-level1-paraIDX1-sentIDX1-level2-paraIDX2-sentIDX2

For sent IDs:
title-level1-paraIDX1-sentIDX1
```
### Making & Deleting Alignments

To make an alignment, a sentence on the left hand side must be chosen first. Sentence alignments made beforehand with that sentence will be highlighted in yellow on the right hand side.
A new alignment can be added by clicking the to-be-aligned sentence on the right hand side, completing the annotations, and clicking save.

Deleting an alignment is simple and safe. Just double click the aligned portion on the right hand side. 

### Combining Similarity Metrics

In addition to just viewing rankings from similarity metrics, users can combine different similarity metrics by shift+clicking on a tab. The resulting rankings are created by adding the selected similarity scores without any weight.
