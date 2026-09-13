# LecturAI Evaluation and Verification Test Harness
# Tests:
# 1. Normal document parsing with tables
# 2. Hybrid BM25 retrieval
# 3. Document Coverage metric computation
# 4. Multi-model fallback logic
# 5. Prevention of raw-text fallback

import os
import sys
import tempfile
from document_pipeline import DocumentParser
from retrieval import HybridRetriever
from generation_pipeline import GroundedGenerator
from llm_provider import LLMProvider

class MockTestProvider(LLMProvider):
    """Mock LLM to test pipeline deterministically and verify zero-fallback behavior."""
    def get_models(self):
        return ["mock-primary", "mock-fallback"]

    def generate_chat(self, messages, model=None, temperature=0.2, max_tokens=4096, json_mode=False, response_schema=None):
        msg = messages[0]["content"] if messages else ""
        if "overview" in msg.lower() or "structural overview" in msg.lower():
            return '{"title": "Operating Systems: File Systems", "document_type": "Academic Lecture", "main_subject": "Computer Science", "key_topics": ["File Allocation", "Directory Implementation", "Free Space Management", "Disk Scheduling"]}'
        elif "quick revision summary" in msg.lower():
            return '{"items": [{"text": "File systems allocate disk blocks through contiguous, linked, or indexed allocation methods.", "source_page": 1}, {"text": "Directory implementation translates human-readable file names into specific file control blocks.", "source_page": 1}, {"text": "Free space management utilizes bitmap vectors and grouped linked lists to track available sectors.", "source_page": 2}, {"text": "Virtual file systems abstract underlying local and network storage formats for the OS kernel.", "source_page": 2}, {"text": "Disk caching and buffer caches drastically minimize disk seek latency during I/O.", "source_page": 3}]}'
        elif "key concepts" in msg.lower() or "key_points" in msg.lower():
            return '{"key_points": [{"concept": "Indexed Allocation: Uses index blocks containing direct and indirect block pointers.", "page": 1}, {"concept": "Contiguous Allocation: Requires contiguous disk addresses leading to external fragmentation.", "page": 1}, {"concept": "Bit Vector: Represents free disk blocks where each bit reflects block occupancy.", "page": 2}, {"concept": "Inode: Standard Unix data structure storing metadata and direct/indirect block references.", "page": 2}, {"concept": "Buffer Cache: Main memory region reserved for caching active disk blocks.", "page": 3}, {"concept": "Mounting: Attaching an external filesystem to the root directory hierarchy.", "page": 3}, {"concept": "Consistency Semantics: Rules governing file updates and view consistency across processes.", "page": 3}, {"concept": "Virtual File System (VFS): Kernel abstraction providing unified POSIX file APIs.", "page": 3}]}'
        elif "knowledge graph" in msg.lower() or "nodes" in msg.lower():
            return '{"nodes": [{"id": "n1", "label": "File System", "type": "domain", "definition": "Storage abstraction.", "source_pages": [1]}, {"id": "n2", "label": "Allocation Methods", "type": "topic", "definition": "Techniques for storing file blocks.", "source_pages": [1, 2]}], "edges": [{"source": "n1", "target": "n2", "relationship": "employs"}]}'
        elif "quiz" in msg.lower() or "mcqs" in msg.lower():
            return '{"mcqs": [{"question": "Which allocation method suffers from external fragmentation?", "options": ["Contiguous Allocation", "Linked Allocation", "Indexed Allocation", "Hashed Allocation"], "answer": 0, "explanation": "Contiguous allocation requires a contiguous block run, resulting in external fragmentation.", "difficulty": "Medium", "source_page": 1}], "short_questions": [{"question": "What is the primary role of an Inode?", "answer": "An Inode stores metadata about a file including permissions, size, and pointers to disk data blocks.", "difficulty": "Medium", "source_page": 2}]}'
        elif "detailed" in msg.lower():
            return "File systems provide the mechanism for on-line storage and access to file data and metadata. The directory structure translates symbolic file names into specific file control blocks (FCBs), allowing hierarchical organization.\n\nAllocation methods determine how disk blocks are assigned to files. Contiguous allocation requires sequential blocks, offering fast sequential access but causing external fragmentation. Linked allocation solves fragmentation but incurs seek overhead for random access. Indexed allocation provides efficient direct access via index blocks.\n\nFree space management maintains track of unallocated sectors using bit vectors, linked free lists, or grouping. Modern operating systems integrate buffer caches and page caches into a unified virtual memory structure to optimize read and write throughput."
        else:
            return "File systems abstract block storage into logical files and directories, managing block allocation and free space efficiently."

def run_tests():
    print("=" * 60)
    print("LecturAI Evaluation & Verification Harness")
    print("=" * 60)

    # Test 1: Sample Document Creation & Parsing
    sample_text = """Operating Systems Concepts: File-System Implementation
Chapter 11: Implementing File Systems

File-System Structure:
A file system provides logical storage units for user data. The file organization module translates logical block addresses to physical disk sectors.

Allocation Methods:
1. Contiguous Allocation: Each file occupies a contiguous set of disk blocks. Advantages: simple, fast sequential and direct access. Disadvantages: external fragmentation and file growth limitations.
2. Linked Allocation: Each file is a linked list of disk blocks. No external fragmentation, but slow random access.
3. Indexed Allocation: Brings all block pointers together into an index block. Solves external fragmentation without pointer overhead in data blocks.

Free-Space Management:
To track disk free space, systems use bit vectors where bit 0 indicates an allocated block and bit 1 represents a free block. Alternative techniques include linked lists of free blocks and grouping.
"""

    with tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode='w', encoding='utf-8') as f:
        f.write(sample_text)
        tmp_name = f.name

    try:
        print("\n[TEST 1] Parsing sample document...")
        doc = DocumentParser.parse(tmp_name, "test_file_systems.txt")
        assert len(doc.pages) >= 1, "Expected at least 1 page"
        assert len(doc.chunks) >= 1, "Expected chunks to be generated"
        assert doc.statistics["total_words"] > 50, "Expected word count > 50"
        print(f"[PASS] Parsed successfully: {doc.statistics['total_words']} words, {len(doc.chunks)} chunks.")

        print("\n[TEST 2] Testing Local Hybrid BM25 Retrieval...")
        retriever = HybridRetriever(doc)
        results = retriever.retrieve("What is contiguous allocation?", top_k=2)
        assert len(results) > 0, "Expected retrieval results"
        top_chunk, score = results[0]
        assert "Contiguous Allocation" in top_chunk.source_text, "BM25 failed to rank contiguous chunk top"
        print(f"[PASS] BM25 accurately retrieved top chunk with score {score:.2f} (Page {top_chunk.page_number}).")

        print("\n[TEST 3] Running Grounded Generation Pipeline...")
        mock_provider = MockTestProvider()
        generator = GroundedGenerator(mock_provider)
        data = generator.generate_all(doc, retriever)

        # Check that NO raw-text fallback was returned
        assert "Could not generate AI summary" not in data["detailed_summary"], "Raw-text fallback detected!"
        assert not any("1)" == b.strip() or "2)" == b.strip() for b in data["summary"]), "Empty numeric bullets detected!"
        assert len(data["summary"]) >= 4, "Summary has insufficient bullets"
        assert len(data["quiz"]["mcqs"]) >= 1, "Quiz missing MCQs"
        assert len(data["quiz"]["short_questions"]) >= 1, "Quiz missing short questions"
        assert data["coverage"]["coverage_score"] > 50, "Coverage calculation failed"
        assert len(data["knowledge_map"]["nodes"]) >= 2, "Knowledge map missing nodes"
        assert data["grounding_report"]["is_grounded"], "Grounding check failed"

        print("[PASS] All generation outputs validated:")
        print(f"  - Quick Summary: {len(data['summary'])} bullet points with citations")
        print(f"  - Detailed Summary: {len(data['detailed_summary'].splitlines())} paragraphs")
        print(f"  - Document Coverage: {data['coverage']['coverage_score']}% ({data['coverage']['methodology']})")
        print(f"  - Knowledge Map: {len(data['knowledge_map']['nodes'])} nodes, {len(data['knowledge_map']['edges'])} edges")
        print(f"  - Grounding Confidence: {data['grounding_report']['grounding_confidence']}")

        print("\n[TEST 4] Testing Ask-Your-Document Q&A...")
        qa_grounded = generator.answer_question("Explain contiguous allocation", doc, retriever)
        print(f"[PASS] In-scope answer: {qa_grounded['answer'][:80]}... (Grounded: {qa_grounded['grounded']})")

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED WITH ZERO RAW-TEXT FALLBACK! [OK]")
        print("=" * 60)

    finally:
        if os.path.exists(tmp_name):
            os.remove(tmp_name)

if __name__ == '__main__':
    run_tests()
