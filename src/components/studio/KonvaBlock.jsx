import React, { useRef, useEffect, useState } from 'react';
import { Image as KonvaImage, Text, Transformer, Group, Line } from 'react-konva';
import { useDesignStore } from '../../store/useDesignStore';

/**
 * Individual block component rendered on Konva canvas
 * Supports images, patterns, and text with transform handles
 */
const KonvaBlock = ({ block, isSelected, onSelect, bounds, centerLines }) => {
  const shapeRef = useRef();
  const transformerRef = useRef();
  const [image, setImage] = useState(null);
  const [isSnappingX, setIsSnappingX] = useState(false);
  const [isSnappingY, setIsSnappingY] = useState(false);
  const updateBlock = useDesignStore((state) => state.updateBlock);

  // Load image for image/pattern blocks
  useEffect(() => {
    if (block.type === 'image' || block.type === 'pattern') {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = block.url;
      img.onload = () => setImage(img);
    }
  }, [block.url, block.type]);

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Handle drag end - update position in store
  const handleDragEnd = (e) => {
    setIsSnappingX(false);
    setIsSnappingY(false);
    updateBlock(block.id, {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  // The "Anti-Bug" Logic & Boundary Safety
  const dragBoundFunc = (pos) => {
    if (!bounds) return pos;

    let newX = pos.x;
    let newY = pos.y;
    
    // Account for node width/height for boundary if scale is 1
    const node = shapeRef.current;
    
    // For text components and images that use strict offset rendering
    const rectWidth = node ? node.width() * node.scaleX() : block.width;
    const rectHeight = node ? node.height() * node.scaleY() : block.height;
    
    // If element is offset relative to its center, adjust boundary checks. 
    // Usually images are drawn top-left (0,0 offset).
    
    // Safety Rails (Boundary Locking)
    if (newX < bounds.x) newX = bounds.x;
    if (newY < bounds.y) newY = bounds.y;
    if (newX + rectWidth > bounds.x + bounds.width) {
      newX = bounds.x + bounds.width - rectWidth;
    }
    if (newY + rectHeight > bounds.y + bounds.height) {
      newY = bounds.y + bounds.height - rectHeight;
    }

    // Snapping Logic
    let snapX = false;
    let snapY = false;

    if (centerLines) {
      const snapThreshold = 15;
      
      // Calculate object's physical center in the absolute canvas
      const objCenterX = newX + (rectWidth / 2);
      const objCenterY = newY + (rectHeight / 2);

      // Snap to X Center (Vertical Guide Line)
      if (Math.abs(objCenterX - centerLines.centerX) < snapThreshold) {
        newX = centerLines.centerX - (rectWidth / 2);
        snapX = true;
      }
      
      // Snap to Y Center (Horizontal Guide Line)
      if (Math.abs(objCenterY - centerLines.centerY) < snapThreshold) {
        newY = centerLines.centerY - (rectHeight / 2);
        snapY = true;
      }

      // Haptic feedback pulse on snap
      if ((snapX && !isSnappingX) || (snapY && !isSnappingY)) {
        if (navigator.vibrate) {
          navigator.vibrate(20); // light tap
        }
      }

      setIsSnappingX(snapX);
      setIsSnappingY(snapY);
    }

    return {
      x: newX,
      y: newY,
    };
  };

  // Handle transform end - update scale and rotation
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to width/height for consistent sizing
    node.scaleX(1);
    node.scaleY(1);

    updateBlock(block.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  // Common props for all shape types
  const commonProps = {
    ref: shapeRef,
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    rotation: block.rotation || 0,
    opacity: block.opacity ?? 1,
    draggable: !block.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: handleDragEnd,
    onDragMove: (e) => {
      // Optimistic visual update (no re-render overhead natively in Konva)
    },
    dragBoundFunc: dragBoundFunc,
    onTransformEnd: handleTransformEnd,
  };

  return (
    <>
      {/* Render based on block type */}
      {(block.type === 'image' || block.type === 'pattern') && image && (
        <KonvaImage
          {...commonProps}
          image={image}
        />
      )}

      {block.type === 'text' && (
        <Text
          {...commonProps}
          text={block.text || block.content || 'Text'}
          fontSize={block.fontSize || 24}
          fontFamily={block.fontFamily || 'Inter'}
          fill={block.fill || block.color || '#000000'}
          width={block.width}
          align="center"
          verticalAlign="middle"
        />
      )}

      {/* Transformer for resize/rotate handles */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
              return oldBox;
            }
            return newBox;
          }}
          // Premium feel with custom anchors
          anchorSize={10}
          anchorCornerRadius={2}
          anchorStroke="#6366f1"
          anchorFill="#ffffff"
          anchorStrokeWidth={2}
          borderStroke="#6366f1"
          borderStrokeWidth={2}
          borderDash={[4, 4]}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left', 'top-right', 
            'bottom-left', 'bottom-right',
            'middle-left', 'middle-right',
            'top-center', 'bottom-center'
          ]}
        />
      )}

      {/* Snap Guides rendered outside block */}
      {isSelected && centerLines && (
        <>
          {isSnappingX && (
            <Line
              points={[centerLines.centerX, 0, centerLines.centerX, 2000]}
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              opacity={0.6}
            />
          )}
          {isSnappingY && (
            <Line
              points={[0, centerLines.centerY, 2000, centerLines.centerY]}
              stroke="#6366f1"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
              opacity={0.6}
            />
          )}
        </>
      )}
    </>
  );
};

export default KonvaBlock;
