import re

def generate_index():
    summary_path = "/Users/lingaraghavendra/folders/Scaler Ai Engineer Assignment/backend/data/projects_summary.md"
    index_path = "/Users/lingaraghavendra/folders/Scaler Ai Engineer Assignment/backend/data/project_index.md"
    
    with open(summary_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    projects = []
    # Split the document by "## Project: "
    sections = content.split("## Project: ")
    for section in sections[1:]:
        lines = section.strip().split("\n")
        project_name = lines[0].strip()
        
        # Try to find a description (first non-empty line that isn't a header, hash, or badge)
        description = "No description provided."
        for line in lines[1:]:
            clean_line = line.strip()
            if clean_line and not clean_line.startswith("#") and not clean_line.startswith("[") and not clean_line.startswith("!"):
                description = clean_line
                break
                
        projects.append(f"- **{project_name}**: {description}")
        
    # Write to project_index.md
    with open(index_path, "w", encoding="utf-8") as out:
        out.write("# Master Index of All Projects\n\n")
        out.write("This is a highly condensed index of all the projects Linga Seetha Rama Raghavendra has built. If asked about his projects, refer to this complete list:\n\n")
        out.write("\n".join(projects))
        out.write("\n")
        
if __name__ == "__main__":
    generate_index()
    print("Successfully generated project_index.md")
