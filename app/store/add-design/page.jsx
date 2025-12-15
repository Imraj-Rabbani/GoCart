'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Upload, X, Plus } from "lucide-react"

export default function DesignStudio() {
    const { getToken } = useAuth()
    
    // Global State
    const [productType, setProductType] = useState("T-shirt") 
    const [color, setColor] = useState("white") 
    const [name, setName] = useState("")
    const [tags, setTags] = useState("")
    const [loading, setLoading] = useState(false)

    // Design Assets & Placements
    const [uploads, setUploads] = useState([]) // { id, url, file }
    const [placements, setPlacements] = useState([]) // { id, uploadId, side, x, y, scale, rotation? }
    const [selectedPlacementId, setSelectedPlacementId] = useState(null)

    // Interaction State
    const [draggingId, setDraggingId] = useState(null) // Placement ID being moved
    const [resizingId, setResizingId] = useState(null) // Placement ID being resized
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 }) // Mouse start pos for deltas
    
    // Refs for containers
    const containerRefs = {
        front: useRef(null),
        back: useRef(null)
    }

    const colors = [
        { id: 'white', class: 'bg-white border-slate-200' },
        { id: 'black', class: 'bg-black border-slate-800' },
        { id: 'red', class: 'bg-red-600 border-red-700' },
        { id: 'blue', class: 'bg-blue-600 border-blue-700' }
    ]

    // --- Asset Handling ---

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        const newUploads = files.map(file => ({
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            file: file
        }))

        setUploads(prev => [...prev, ...newUploads])
        
        // Auto-add first upload to front if empty (UX convenience)
        if (uploads.length === 0 && placements.length === 0 && newUploads.length > 0) {
            addPlacement(newUploads[0].id, 'front')
        }
    }

    const removeUpload = (id) => {
        setUploads(prev => prev.filter(u => u.id !== id))
        setPlacements(prev => prev.filter(p => p.uploadId !== id)) // Remove placements of this asset
    }

    const addPlacement = (uploadId, side) => {
        const newPlacement = {
            id: crypto.randomUUID(),
            uploadId,
            side,
            x: 40, // Center-ish (%)
            y: 30, // Center-ish (%)
            scale: 1, // 100% of base size (e.g. 150px)
        }
        setPlacements(prev => [...prev, newPlacement])
        setSelectedPlacementId(newPlacement.id)
    }

    const removePlacement = (id) => {
        setPlacements(prev => prev.filter(p => p.id !== id))
        if (selectedPlacementId === id) setSelectedPlacementId(null)
    }

    // --- Interaction Logic (Move & Resize) ---

    const handleMouseDown = (e, placementId, action) => {
        e.stopPropagation()
        e.preventDefault()
        
        if (action === 'move') {
            setDraggingId(placementId)
            setSelectedPlacementId(placementId)
        } else if (action === 'resize') {
            setResizingId(placementId)
            setSelectedPlacementId(placementId)
        }
        
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!draggingId && !resizingId) return

            const deltaX = e.clientX - dragStart.x
            const deltaY = e.clientY - dragStart.y
            
            setDragStart({ x: e.clientX, y: e.clientY }) // Update reference for next frame

            if (draggingId) {
                setPlacements(prev => prev.map(p => {
                    if (p.id !== draggingId) return p
                    
                    // Convert pixel delta to % (Approximate based on 300px container width for smoothness)
                    // Better: Get actual container width
                    const container = containerRefs[p.side].current
                    if (!container) return p
                    
                    const rect = container.getBoundingClientRect()
                    const percentDeltaX = (deltaX / rect.width) * 100
                    const percentDeltaY = (deltaY / rect.height) * 100
                    
                    return {
                        ...p,
                        x: Math.max(0, Math.min(100, p.x + percentDeltaX)),
                        y: Math.max(0, Math.min(100, p.y + percentDeltaY))
                    }
                }))
            }

            if (resizingId) {
                setPlacements(prev => prev.map(p => {
                    if (p.id !== resizingId) return p
                    // Sensitivity factor
                    const scaleDelta = deltaX * 0.01 
                    return {
                        ...p,
                        scale: Math.max(0.2, Math.min(3, p.scale + scaleDelta))
                    }
                }))
            }
        }

        const handleMouseUp = () => {
            setDraggingId(null)
            setResizingId(null)
        }

        if (draggingId || resizingId) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [draggingId, resizingId, dragStart])


    // --- Helper for Assets ---
    const getProductImage = (side) => {
        const typeKey = productType === 'Sweatshirt' ? 'hoodie' : productType.toLowerCase().replace('-', '')
        let assetKey = `${typeKey}_${color}_${side}`
        
        if (assets[assetKey]) return assets[assetKey]

        // Fallbacks
        if (color !== 'white' && color !== 'black') return assets[`${typeKey}_white_${side}`]
        if (color === 'black' && !assets[assetKey]) return assets[`${typeKey}_white_${side}`]
        return assets[`${typeKey}_white_${side}`]
    }

    // --- Drag n Drop from Sidebar ---
    const handleDrop = (e, side) => {
        e.preventDefault()
        const uploadId = e.dataTransfer.getData("uploadId")
        if (uploadId) {
            addPlacement(uploadId, side)
        }
    }
    const handleDragOver = (e) => e.preventDefault()


    const onSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (placements.length === 0) throw new Error("Please design something first!")
            
            // Helper to load image
            const loadImage = (src) => new Promise((resolve, reject) => {
                const img = new window.Image()
                img.crossOrigin = "anonymous"
                img.src = src
                img.onload = () => resolve(img)
                img.onerror = (e) => reject(e)
            })

            // Generate composite images for Front and Back
            const generateComposite = async (side) => {
                const sidePlacements = placements.filter(p => p.side === side)
                
                // Canvas setup
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                
                // Base dimensions - we'll use a standard output size
                const width = 800
                const height = 1000 // 4:5 aspect ratio roughly or match source
                canvas.width = width
                canvas.height = height

                // 1. Draw Base Product Image
                const baseSrc = getProductImage(side).src
                if (!baseSrc) throw new Error("Missing base image")
                const baseImg = await loadImage(baseSrc)
                
                // Calculate aspect ratio to fit 'contain' style in canvas
                const scaleFactor = Math.min(width / baseImg.width, height / baseImg.height)
                const drawWidth = baseImg.width * scaleFactor
                const drawHeight = baseImg.height * scaleFactor
                const offsetX = (width - drawWidth) / 2
                const offsetY = (height - drawHeight) / 2

                // Tinting Logic (if needed) - For now draw base.
                // Note: Canvas filtering is complex. If using CSS mix-blend-mode for tinting,
                // we would need to replicate that pixel manipulation here.
                // Given "donot need to change route.js", we must do best effort.
                // Simple draw:
                ctx.drawImage(baseImg, offsetX, offsetY, drawWidth, drawHeight)

                // 2. Draw Tint (if applicable)
                if (!assets[`${productType === 'Sweatshirt' ? 'hoodie' : productType.toLowerCase().replace('-', '')}_${color}_${side}`] && color !== 'white') {
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.fillStyle = color
                    // Masking to the image is hard without path data. 
                    // We will draw a rect over the whole image area which matches the 'mix-blend-multiply' logic 
                    // of the CSS (which effectively tints the whole square if not masked).
                    // Front-end used a maskImage. Canvas can use 'source-in' if we have the mask in a layer.
                    // We can reuse the baseImg as the mask.
                    
                    // Save context
                    ctx.save()
                    // Create temp canvas for the mask
                    const currLayer = ctx.getImageData(0,0,width,height)
                    
                    // Fill rect with color
                    ctx.fillStyle = color
                    ctx.fillRect(offsetX, offsetY, drawWidth, drawHeight)
                    
                    // We just painted over it. We need 'multiply'.
                    // But we only want to multiply where the SHIRT is.
                    // Since baseImg allows us to know alpha:
                    // Actually, 'source-in' composites existing content with new?
                    
                    // Simpler approach for "multiply" blend mode supported in modern browsers
                    // ctx.globalCompositeOperation = 'multiply' // Already set
                    // But this tints the white background too if the baseImg has white bg.
                    // Assuming base assets have white bg (as per generation artifacts), this will make the whole image red.
                    // The CSS solution relied on `mask-image` to restrict it.
                    // We can apply the baseImg as a mask here too.
                    
                    // Reset to normal to prepare mask
                    ctx.globalCompositeOperation = 'destination-in'
                    ctx.drawImage(baseImg, offsetX, offsetY, drawWidth, drawHeight)
                    
                    ctx.restore()
                    ctx.globalCompositeOperation = 'source-over' // Reset
                }

                // 3. Draw Design Layers
                // Container Area Definition (matches CSS: top 15%, left 20%, width 60%, etc)
                // CSS: top: 15%, left: 20%, right: 20% (width 60%), bottom 15% (height 70%)
                const containerX = offsetX + (drawWidth * 0.20)
                const containerY = offsetY + (drawHeight * 0.15)
                const containerW = drawWidth * 0.60
                const containerH = drawHeight * 0.70

                for (const p of sidePlacements) {
                    const upload = uploads.find(u => u.id === p.uploadId)
                    if (upload) {
                        const designImg = await loadImage(upload.url)
                        
                        // p.x / p.y are percentages of the CONTAINER (0-100)
                        // p.scale is scale relative to "30% of container width" base size
                        
                        const baseDesignW = containerW * 0.30
                        // const baseDesignH = ... aspect ratio dependent

                        const designDrawW = baseDesignW * p.scale
                        const designDrawH = designDrawW * (designImg.height / designImg.width)
                        
                        const centerX = containerX + (containerW * (p.x / 100))
                        const centerY = containerY + (containerH * (p.y / 100))
                        
                        const drawX = centerX - (designDrawW / 2)
                        const drawY = centerY - (designDrawH / 2)
                        
                        ctx.drawImage(designImg, drawX, drawY, designDrawW, designDrawH)
                    }
                }

                return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            }

            // Generate Front and Back blobls
            const frontBlob = await generateComposite('front')
            const backBlob = await generateComposite('back')

            const formData = new FormData()
            formData.append('name', name)
            formData.append('tags', tags)
            formData.append('productType', productType)
            formData.append('color', color)
            
            // Append the composite images
            if (frontBlob) formData.append('images', frontBlob, 'front-view.png')
            if (backBlob) formData.append('images', backBlob, 'back-view.png')

            const token = await getToken()
            // Using same endpoint
            await axios.post('/api/store/design', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            toast.success("Design submitted successfully!")
            
            // Cleanup
            setPlacements([])
            setUploads([])
            setName("")
            setTags("")
        } catch (error) {
            console.error(error)
            toast.error(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-8 bg-slate-50 selection:bg-indigo-100 pb-32">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Designer <span className="text-green-600">Studio</span></h1>
                        <p className="text-slate-500 mt-2">Craft your custom apparel with multiple layers.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT SIDEBAR: Tools (3 cols) */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        {/* 1. Upload Gallery */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <Upload size={18} /> Assets
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3 mb-4 max-h-48 overflow-y-auto scrollbar-thin">
                                {uploads.map(u => (
                                    <div 
                                        key={u.id} 
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData("uploadId", u.id)}
                                        className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-400 transition"
                                    >
                                        <Image src={u.url} fill className="object-cover" alt="asset" />
                                        <button 
                                            onClick={() => removeUpload(u.id)}
                                            className="absolute top-1 right-1 bg-white/90 p-1 rounded-md opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition text-slate-400 hover:text-indigo-500">
                                    <Plus size={24} />
                                    <span className="text-xs font-medium mt-1">Add</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                            <p className="text-xs text-slate-400 text-center">Drag image to shirt to place</p>
                        </div>

                        {/* 2. Config */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Product</label>
                                <select 
                                    value={productType} 
                                    onChange={(e) => setProductType(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                                >
                                    <option>T-shirt</option>
                                    <option>Hoodie</option>
                                    <option>Sweatshirt</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map(c => (
                                        <button 
                                            key={c.id}
                                            onClick={() => setColor(c.id)}
                                            className={`w-8 h-8 rounded-full shadow-sm border-2 transition-all ${c.class} ${color === c.id ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                                            title={c.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Metadata */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Details</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Design Name" 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                />
                            </div>
                            <input 
                                type="text" 
                                value={tags} 
                                onChange={e => setTags(e.target.value)}
                                placeholder="Tags (comma separated)" 
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                            />
                            <button 
                                onClick={onSubmit} 
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200 disabled:opacity-50 flex justify-center"
                            >
                                {loading ? "Publishing..." : "Publish Design"}
                            </button>
                        </div>
                    </div>

                    {/* MAIN CANVAS: (9 cols) */}
                    <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['front', 'back'].map(side => (
                            <div 
                                key={side} 
                                onDrop={(e) => handleDrop(e, side)}
                                onDragOver={handleDragOver}
                                className="bg-white rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group min-h-[500px]"
                            >
                                <h3 className="absolute top-6 left-6 text-xs font-bold text-slate-400 uppercase tracking-widest z-10 pointer-events-none">{side} View</h3>
                                
                                <div className="absolute inset-4 sm:inset-10 flex items-center justify-center">
                                    {/* Base Image */}
                                    <div className="relative w-full h-full max-w-lg">
                                        <Image 
                                            src={getProductImage(side)} 
                                            alt={`${productType} ${side}`}
                                            fill
                                            className="object-contain pointer-events-none select-none"
                                            priority
                                        />

                                        {/* Tint Overlay */}
                                        {/* Only show tint if we don't have the specific colored asset and it's not white */}
                                        {!assets[`${productType === 'Sweatshirt' ? 'hoodie' : productType.toLowerCase().replace('-', '')}_${color}_${side}`] && color !== 'white' && (
                                            <div 
                                                className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50 z-0"
                                                style={{ 
                                                    maskImage: `url(${getProductImage(side).src})`,
                                                    WebkitMaskImage: `url(${getProductImage(side).src})`, 
                                                    maskSize: 'contain',
                                                    WebkitMaskSize: 'contain',
                                                    maskRepeat: 'no-repeat',
                                                    WebkitMaskRepeat: 'no-repeat',
                                                    maskPosition: 'center',
                                                    WebkitMaskPosition: 'center',
                                                    backgroundColor: color
                                                }}
                                            />
                                        )}

                                        {/* Layer Container (Printable Area Approx) */}
                                        <div 
                                            ref={containerRefs[side]}
                                            className="absolute top-[15%] left-[20%] right-[20%] bottom-[15%] z-20 "
                                        >
                                            {placements.filter(p => p.side === side).map(p => {
                                                const upload = uploads.find(u => u.id === p.uploadId)
                                                if (!upload) return null
                                                const isSelected = selectedPlacementId === p.id

                                                return (
                                                    <div 
                                                        key={p.id}
                                                        className={`absolute cursor-move select-none group/item ${isSelected ? 'z-50' : 'z-30'}`}
                                                        style={{
                                                            left: `${p.x}%`,
                                                            top: `${p.y}%`,
                                                            width: `${30 * p.scale}%`, // Base width 30% of container
                                                            transform: 'translate(-50%, -50%)',
                                                        }}
                                                        onMouseDown={(e) => handleMouseDown(e, p.id, 'move')}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedPlacementId(p.id) }}
                                                    >
                                                        {/* Image */}
                                                        <Image
                                                            src={upload.url}
                                                            width={500}
                                                            height={500}
                                                            alt="design layer"
                                                            className={`w-full h-auto pointer-events-none drop-shadow-sm ${isSelected ? 'brightness-105' : ''}`}
                                                        />
                                                        
                                                        {/* Controls (Visible on hover or select) */}
                                                        <div className={`absolute -inset-2 border-2 border-indigo-500 rounded-lg pointer-events-none transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-50'}`} />
                                                        
                                                        {isSelected && (
                                                            <>
                                                                {/* Remove Button */}
                                                                <button 
                                                                    className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition pointer-events-auto"
                                                                    onMouseDown={(e) => { e.stopPropagation(); removePlacement(p.id) }}
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                                {/* Resize Handle */}
                                                                <div 
                                                                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-500 border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-110 transition pointer-events-auto"
                                                                    onMouseDown={(e) => handleMouseDown(e, p.id, 'resize')}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    )
}