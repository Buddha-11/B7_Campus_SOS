// src/pages/ReportIssue.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Camera, ArrowLeft, CheckCircle, Crosshair, X, Upload, Image as ImageIcon, AlertCircle, Sparkles, Tag } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const VALIDATOR_URL = import.meta.env.VITE_VALIDATOR_URL || "http://localhost:9000/validate";
const AUTH_TOKEN_KEY = "campus_sos_token";

const PREDEFINED_TAGS = [
  "Wifi","Network","Cleanliness","Plumbing","Electrical","Lighting",
  "Safety","Security","Maintenance","Sanitation","Structural",
  "Accessibility","HVAC","Pest Control","Gardening","Transport",
  "Signage","Fire Safety","Other"
];

const ReportIssue = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
    description: "",
    image: null as File | null,
    imageUrl: "",
    severity: "Low",
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationAllowed, setValidationAllowed] = useState<boolean | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [llmRaw, setLlmRaw] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const resetMsgs = () => setErrorMsg(null);

  const validateLocal = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (formData.lat === null || formData.lng === null)
      newErrors.location = "Location coordinates are required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    return newErrors;
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const uploadImageToBackend = async (): Promise<string | null> => {
    if (!formData.image) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", formData.image);
      const headers: Record<string, string> = {
        Accept: "application/json",
        ...getAuthHeader(),
      };
      const res = await fetch(`${API_BASE}/api/upload/image`, {
        method: "POST",
        headers,
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Upload failed");
      const url = json.url || json.secure_url || json.imageUrl || json.data?.url;
      if (!url) throw new Error("Upload succeeded but response missing URL");
      setImageUrl(url);
      setFormData((prev) => ({ ...prev, imageUrl: url }));
      return url;
    } finally {
      setUploading(false);
    }
  };

  const callValidator = async (imgUrl?: string) => {
    setValidating(true);
    resetMsgs();
    setValidationAllowed(null);
    setSuggestedTags([]);
    setLlmRaw(null);

    try {
      const body = {
        description: formData.description,
        imageUrl: imgUrl || imageUrl || formData.imageUrl || null,
      };
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      };
      const res = await fetch(VALIDATOR_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || json?.message || "Validation failed");

      setLlmRaw(JSON.stringify(json.raw_llm ?? json, null, 2));
      const allowed = Boolean(json.allowed);
      setValidationAllowed(allowed);

      if (allowed) {
        const suggested: string[] = Array.isArray(json.suggestedTags) ? json.suggestedTags : [];
        const filtered = suggested.filter((t) => PREDEFINED_TAGS.includes(t));
        setSuggestedTags(filtered);
      } else {
        const reason = json.reason || "Blocked by validator";
        setErrorMsg(`Validation blocked: ${reason}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Validation failed");
      setValidationAllowed(false);
    } finally {
      setValidating(false);
    }
  };

  const handleValidate = async () => {
    resetMsgs();
    const newErrors = validateLocal();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      let url = imageUrl || formData.imageUrl;
      if (formData.image && !url) {
        url = await uploadImageToBackend();
      }
      await callValidator(url || undefined);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Validation workflow failed");
    }
  };

  const addSuggestedTags = () => {
    if (!suggestedTags || suggestedTags.length === 0) return;
    const merged = Array.from(new Set([...formData.tags, ...suggestedTags]));
    const filtered = merged.filter((t) => PREDEFINED_TAGS.includes(t));
    setFormData((prev) => ({ ...prev, tags: filtered }));
    setSuggestedTags([]);
  };

  const removeTag = (t: string) =>
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));

  const toggleTag = (tag: string) => {
    if (formData.tags.includes(tag)) {
      removeTag(tag);
    } else {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleUseMyLocation = () => {
    resetMsgs();
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }
    setErrorMsg("Getting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const name = `My location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        setFormData((prev) => ({ ...prev, lat, lng, location: name }));
        setErrorMsg(null);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setErrorMsg(`Unable to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    resetMsgs();
    const newErrors = validateLocal();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (validationAllowed !== true) {
      setErrorMsg("Please validate the report before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error("Not authenticated. Please login.");
      let url = imageUrl || formData.imageUrl;
      if (formData.image && !url) {
        url = await uploadImageToBackend();
      }
      const payload = {
        title: formData.title,
        description: formData.description,
        lng: formData.lng,
        lat: formData.lat,
        tags: formData.tags,
        severity: formData.severity,
        imageUrl: url,
      };
      const res = await fetch(`${API_BASE}/api/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || json?.error || "Issue creation failed");
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar userType="student" />
        <div className="flex-1 flex flex-col">
          <Header title="Report Issue" subtitle="Submit a new campus issue" />
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Issue Reported Successfully!</h2>
              <p className="text-gray-600 mb-8">
                Your report has been submitted and will be reviewed by our team shortly.
              </p>
              {/* <button
                onClick={() => setSubmitted(false)}
                className="w-full bg-blue-500 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button> */}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar userType="student" />
      <div className="flex-1 flex flex-col">
        <Header title="Report a New Issue" subtitle="Help improve our campus by reporting problems" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Issue Details</h2>
                <p className="text-sm text-gray-600 mt-1">Fill in the information below to report an issue</p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Issue Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Broken water fountain in main building"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.title ? "border-red-300 bg-red-50" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Issue Tags <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Custom Multi-Select */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left flex items-center justify-between"
                    >
                      <span className="text-gray-600 text-sm">
                        {formData.tags.length === 0 ? "Select tags..." : `${formData.tags.length} tag(s) selected`}
                      </span>
                      <Tag className="h-4 w-4 text-gray-400" />
                    </button>

                    {showTagDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                        <div className="p-2 space-y-1">
                          {PREDEFINED_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                formData.tags.includes(tag)
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span className="flex items-center justify-between">
                                {tag}
                                {formData.tags.includes(tag) && (
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Tags Display */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Location <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g., Library Level 3, Room 204"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className={`w-full pl-11 pr-4 py-3 rounded-lg border ${
                          errors.location ? "border-red-300 bg-red-50" : "border-gray-200"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap"
                    >
                      <Crosshair className="h-4 w-4" />
                      Use my location
                    </button>
                  </div>

                  {/* Coordinates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="25.4358"
                        value={formData.lat ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lat: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="81.8496"
                        value={formData.lng ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            lng: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>

                  {formData.lat !== null && formData.lng !== null && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      Coordinates: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}
                    </p>
                  )}
                  
                  {errors.location && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.location}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Provide detailed information about the issue..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.description ? "border-red-300 bg-red-50" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Upload Image <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                    {(imageUrl || formData.imageUrl) ? (
                      <div className="space-y-3">
                        <img
                          src={imageUrl || formData.imageUrl}
                          alt="Uploaded preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl(null);
                            setFormData({ ...formData, image: null, imageUrl: "" });
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <X className="h-4 w-4" />
                          Remove image
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <label className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                            Click to upload
                          </span>
                          <span className="text-gray-600 text-sm"> or drag and drop</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              setFormData({ ...formData, image: e.target.files?.[0] || null })
                            }
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Uploading image...
                    </div>
                  )}
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">Severity Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Low", "Medium", "High"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, severity: level })}
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                          formData.severity === level
                            ? level === "High"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : level === "Medium"
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div className="space-y-3 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-600" />
                      <label className="text-sm font-medium text-amber-900">AI Suggested Tags</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-800 text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addSuggestedTags}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                      >
                        Add All Tags
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestedTags([])}
                        className="px-4 py-2 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 transition-colors text-sm font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Status */}
                {validationAllowed !== null && (
                  <div className={`p-4 rounded-lg border ${
                    validationAllowed
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationAllowed ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Report validated successfully
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-900">
                            Validation failed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-800">{errorMsg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={validating || uploading}
                    className="flex-1 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {validating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Validating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Validate
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || validationAllowed !== true}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Debug Info */}
            {llmRaw && (
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <details className="group">
                  <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Validation Details (Debug)</span>
                    <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-auto font-mono">
                      {llmRaw}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function Demo() {
  return <ReportIssue />;
}